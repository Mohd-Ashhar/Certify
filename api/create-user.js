import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Unified user-creation endpoint.
// - Admin path (default): requires full_name + role, creates the user on
//   behalf of an admin (regional_admin, auditor, certification_body, client).
// - Self-signup path (selfSignup: true): public registration. Accepts name +
//   extended stakeholder metadata. Always sets email_confirm: true so the
//   user can log in immediately (or after approval for stakeholder flows).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      email, password, role, region, company_name,
      // admin-path field
      full_name,
      // self-signup-path fields
      selfSignup, name,
      activity, number_of_employees, number_of_locations,
      website, city, country, contact_number, contact_role,
      stakeholder_type, approval_status,
    } = req.body;

    const displayName = full_name || name;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Missing required fields: email, password, name' });
    }

    const isSelfSignup = !!selfSignup;
    const assignedRole = role || (isSelfSignup ? 'client' : null);

    if (!assignedRole) {
      return res.status(400).json({ error: 'Missing required field: role' });
    }

    const allowedRoles = isSelfSignup
      ? ['client', 'auditor', 'certification_body']
      : ['regional_admin', 'auditor', 'certification_body', 'client'];

    if (!allowedRoles.includes(assignedRole)) {
      return res.status(400).json({
        error: `Invalid role. Allowed: ${allowedRoles.join(', ')}`,
      });
    }

    // Build user_metadata. Self-signup carries extra stakeholder details.
    const userMetadata = isSelfSignup
      ? {
          name: displayName,
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
        }
      : {
          name: displayName,
          role: assignedRole,
          company_name: company_name || null,
          region: region || null,
        };

    // Always pre-confirm email — allows immediate login after signup.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Upsert profile (the DB trigger may have already inserted a row).
    const profileRow = isSelfSignup
      ? {
          id: authData.user.id,
          email,
          full_name: displayName,
          role: assignedRole,
          company_name: company_name || null,
          region: region || null,
          stakeholder_type: stakeholder_type || 'client',
          approval_status: approval_status || 'approved',
        }
      : {
          id: authData.user.id,
          email,
          full_name: displayName,
          role: assignedRole,
          region: region || null,
          company_name: company_name || null,
        };

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileRow, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      if (!isSelfSignup) {
        return res.status(500).json({
          error: 'User created but profile update failed: ' + profileError.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        full_name: displayName,
        role: assignedRole,
        region: region || null,
        company_name: company_name || null,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
