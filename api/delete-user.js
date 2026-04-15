import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Best-effort delete — runs each cleanup independently and logs (but does not
// abort) on error, so one missing table doesn't block the whole deletion.
async function tryDelete(label, promise) {
  try {
    const { error } = await promise;
    if (error) console.warn(`[delete-user] ${label} cleanup warning:`, error.message);
  } catch (err) {
    console.warn(`[delete-user] ${label} cleanup threw:`, err?.message || err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' });
    }

    // 1. Clean up dependent rows that reference this user via FK.
    //    Order matters where there are chained FKs.
    await tryDelete('notifications',
      supabaseAdmin.from('notifications').delete().eq('user_id', userId));

    await tryDelete('documents (uploaded by)',
      supabaseAdmin.from('documents').delete().eq('client_id', userId));

    await tryDelete('applications (as client)',
      supabaseAdmin.from('applications').delete().eq('client_id', userId));

    await tryDelete('applications (as auditor unassign)',
      supabaseAdmin.from('applications').update({ assigned_auditor_id: null }).eq('assigned_auditor_id', userId));

    await tryDelete('referrals (as referrer)',
      supabaseAdmin.from('referrals').delete().eq('referrer_id', userId));

    await tryDelete('referrals (as referred)',
      supabaseAdmin.from('referrals').delete().eq('referred_id', userId));

    await tryDelete('certification_bodies (created_by)',
      supabaseAdmin.from('certification_bodies').delete().eq('created_by', userId));

    // 2. Delete the profile row.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) {
      console.warn('[delete-user] profile delete warning:', profileError.message);
    }

    // 3. Delete the auth user. This is the authoritative step.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      return res.status(400).json({
        error: `Failed to delete auth user: ${authError.message}`,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
