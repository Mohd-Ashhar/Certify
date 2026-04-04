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
    const { adminId, referralId, payoutStatus } = req.body;
    if (!adminId || !referralId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify caller is super_admin
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

    // Get referral to notify the referrer
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
  } catch (error) {
    console.error('Mark payout error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
