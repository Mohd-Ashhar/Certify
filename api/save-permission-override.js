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
    const { role, permission, enabled, updatedBy, clear } = req.body;

    if (!role || !permission) {
      return res.status(400).json({ error: 'role and permission are required' });
    }

    // `clear: true` removes the override so the baseline from roles.js applies.
    if (clear) {
      const { error } = await supabaseAdmin
        .from('custom_permissions')
        .delete()
        .eq('role', role)
        .eq('permission', permission);
      if (error) throw error;
      return res.status(200).json({ success: true, cleared: true });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean (or pass clear:true)' });
    }

    const { error } = await supabaseAdmin
      .from('custom_permissions')
      .upsert(
        {
          role,
          permission,
          enabled,
          updated_by: updatedBy || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'role,permission' }
      );

    if (error) throw error;
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Save permission override error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
