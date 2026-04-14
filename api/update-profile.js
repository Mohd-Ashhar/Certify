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
    const { userId, full_name, role, company_name, region, email, stakeholder_type, approval_status } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Update profile
    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (role !== undefined) updates.role = role;
    if (company_name !== undefined) updates.company_name = company_name;
    if (region !== undefined) updates.region = region;
    if (email !== undefined) updates.email = email;
    if (stakeholder_type !== undefined) updates.stakeholder_type = stakeholder_type;
    if (approval_status !== undefined) updates.approval_status = approval_status;

    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, ...updates }, { onConflict: 'id' });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // If email changed, update auth user too
    if (email) {
      await supabaseAdmin.auth.admin.updateUserById(userId, { email });
    }

    // Sync user_metadata
    const metaUpdates = {};
    if (full_name !== undefined) metaUpdates.name = full_name;
    if (company_name !== undefined) metaUpdates.company_name = company_name;
    if (region !== undefined) metaUpdates.region = region;

    if (Object.keys(metaUpdates).length > 0) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: metaUpdates,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
