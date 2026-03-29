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
    const { email, password, full_name, role, region, company_name } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Missing required fields: email, password, full_name, role' });
    }

    const allowedRoles = ['regional_admin', 'auditor', 'certification_body', 'client'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Allowed: regional_admin, auditor, certification_body, client' });
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: full_name,
        role,
        company_name: company_name || null,
        region: region || null,
      },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Upsert the profile row (the trigger may have already created it)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name,
        role,
        region: region || null,
        company_name: company_name || null,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      return res.status(500).json({ error: 'User created but profile update failed: ' + profileError.message });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        full_name,
        role,
        region,
        company_name,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
