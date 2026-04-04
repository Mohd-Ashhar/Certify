import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { referralCode, referredId, referredEmail } = req.body;

    if (!referralCode || !referredEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the referrer by matching the first 8 chars of their user ID
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw listError;

    const referrer = users.users.find(u => u.id.startsWith(referralCode));
    if (!referrer) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    // Don't allow self-referral
    if (referrer.id === referredId) {
      return res.status(400).json({ error: 'Self-referral not allowed' });
    }

    // Check for duplicate referral
    const { data: existing } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrer.id)
      .eq('referred_email', referredEmail)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({ success: true, message: 'Referral already recorded' });
    }

    // Insert referral record
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
  } catch (error) {
    console.error('Record referral error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
