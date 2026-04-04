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
  } catch (error) {
    console.error('Check referral discount error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
