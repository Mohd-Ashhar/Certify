import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const action = req.body?.action;

  try {
    if (action === 'list') return await listReferrals(req, res);
    if (action === 'mark-payout') return await markPayout(req, res);
    if (action === 'record') return await recordReferral(req, res);
    if (action === 'check-discount') return await checkDiscount(req, res);
    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    console.error(`Referrals action "${action}" error:`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

async function listReferrals(req, res) {
  const { adminId } = req.body;
  if (!adminId) return res.status(400).json({ error: 'Missing adminId' });

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .maybeSingle();

  if (!profile || profile.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data: referrals, error } = await supabaseAdmin
    .from('referrals')
    .select('*')
    .eq('status', 'converted')
    .order('converted_at', { ascending: false });

  if (error) throw error;

  const referrerIds = [...new Set(referrals.map(r => r.referrer_id))];
  let referrerMap = {};
  if (referrerIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email:id')
      .in('id', referrerIds);

    for (const rid of referrerIds) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(rid);
      if (u?.user) {
        const prof = profiles?.find(p => p.id === rid);
        referrerMap[rid] = {
          name: prof?.full_name || 'Unknown',
          email: u.user.email,
        };
      }
    }
  }

  const enriched = referrals.map(r => ({
    ...r,
    referrer_name: referrerMap[r.referrer_id]?.name || 'Unknown',
    referrer_email: referrerMap[r.referrer_id]?.email || 'Unknown',
  }));

  return res.status(200).json({ referrals: enriched });
}

async function markPayout(req, res) {
  const { adminId, referralId, payoutStatus } = req.body;
  if (!adminId || !referralId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .maybeSingle();

  if (!profile || profile.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { error } = await supabaseAdmin
    .from('referrals')
    .update({
      payout_status: payoutStatus || 'paid',
      paid_at: payoutStatus === 'paid' ? new Date().toISOString() : null,
    })
    .eq('id', referralId);

  if (error) throw error;

  const { data: referral } = await supabaseAdmin
    .from('referrals')
    .select('referrer_id, commission_amount')
    .eq('id', referralId)
    .maybeSingle();

  if (referral && payoutStatus === 'paid') {
    await supabaseAdmin.from('notifications').insert({
      user_id: referral.referrer_id,
      title: 'Payout Sent!',
      message: `Your referral commission of $${parseFloat(referral.commission_amount).toFixed(2)} has been paid out. Check your bank account.`,
      type: 'payout',
    });
  }

  return res.status(200).json({ success: true });
}

async function recordReferral(req, res) {
  const { referralCode, referredId, referredEmail } = req.body;

  if (!referralCode || !referredEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;

  const referrer = users.users.find(u => u.id.startsWith(referralCode));
  if (!referrer) {
    return res.status(404).json({ error: 'Invalid referral code' });
  }

  if (referrer.id === referredId) {
    return res.status(400).json({ error: 'Self-referral not allowed' });
  }

  const { data: existing } = await supabaseAdmin
    .from('referrals')
    .select('id')
    .eq('referrer_id', referrer.id)
    .eq('referred_email', referredEmail)
    .maybeSingle();

  if (existing) {
    return res.status(200).json({ success: true, message: 'Referral already recorded' });
  }

  const { error: insertError } = await supabaseAdmin
    .from('referrals')
    .insert({
      referrer_id: referrer.id,
      referred_id: referredId || null,
      referred_email: referredEmail,
      status: referredId ? 'signed_up' : 'pending',
    });

  if (insertError) throw insertError;

  return res.status(200).json({ success: true });
}

async function checkDiscount(req, res) {
  const { clientId } = req.body;
  if (!clientId) return res.status(400).json({ error: 'Missing clientId' });

  const { data: userMeta } = await supabaseAdmin.auth.admin.getUserById(clientId);
  const clientEmail = userMeta?.user?.email;

  if (!clientEmail) {
    return res.status(200).json({ hasDiscount: false });
  }

  const { data: referral } = await supabaseAdmin
    .from('referrals')
    .select('id, referrer_id')
    .eq('referred_email', clientEmail)
    .in('status', ['pending', 'signed_up'])
    .maybeSingle();

  return res.status(200).json({ hasDiscount: !!referral });
}
