import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Public self-signup endpoint. Creates an auth user with email pre-confirmed
// so the user can log in immediately (or after admin approval for stakeholders).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      email, password, name, role,
      company_name, activity, number_of_employees, number_of_locations,
      website, city, country, region, contact_number, contact_role,
      stakeholder_type, approval_status,
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields: email, password, name' });
    }

    const assignedRole = role || 'client';
    const allowedRoles = ['client', 'auditor', 'certification_body'];
    if (!allowedRoles.includes(assignedRole)) {
      return res.status(400).json({ error: 'Invalid role for public signup' });
    }

    // Create the auth user with email pre-confirmed so login works immediately.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: assignedRole,
        company_name: company_name || null,
        activity: activity || null,
        number_of_employees: number_of_employees || null,
        number_of_locations: number_of_locations || null,
        website: website || null,
        city: city || null,
        country: country || null,
        region: region || null,
        contact_number: contact_number || null,
        contact_role: contact_role || null,
        stakeholder_type: stakeholder_type || 'client',
        approval_status: approval_status || 'approved',
      },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Upsert the profile row (handle_new_user trigger may also have created one)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name: name,
        role: assignedRole,
        company_name: company_name || null,
        region: region || null,
        stakeholder_type: stakeholder_type || 'client',
        approval_status: approval_status || 'approved',
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile upsert error:', profileError);
    }

    return res.status(200).json({
      success: true,
      user: { id: authData.user.id, email },
    });
  } catch (error) {
    console.error('Public signup error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
