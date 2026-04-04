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
    const { adminId } = req.body;
    if (!adminId) return res.status(400).json({ error: 'Missing adminId' });

    // Verify caller is super_admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', adminId)
      .maybeSingle();

    if (!profile || profile.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fetch all converted referrals with referrer info
    const { data: referrals, error } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('status', 'converted')
      .order('converted_at', { ascending: false });

    if (error) throw error;

    // Get referrer names
    const referrerIds = [...new Set(referrals.map(r => r.referrer_id))];
    let referrerMap = {};
    if (referrerIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email:id')
        .in('id', referrerIds);

      // Also get emails from auth
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
  } catch (error) {
    console.error('Admin referrals error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
