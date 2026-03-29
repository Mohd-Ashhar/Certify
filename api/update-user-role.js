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
    const { userId, newRole } = req.body;

    if (!userId || !newRole) {
      return res.status(400).json({ error: 'Missing required fields: userId, newRole' });
    }

    // Update auth user metadata so JWT reflects the new role
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role: newRole },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Also update the profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
