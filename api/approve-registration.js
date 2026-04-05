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
    const { userId, action, adminId } = req.body;

    if (!userId || !action) {
      return res.status(400).json({ error: 'Missing userId or action' });
    }

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approved" or "rejected"' });
    }

    // Verify the admin making the request
    if (adminId) {
      const { data: adminProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', adminId)
        .maybeSingle();

      if (!adminProfile || !['super_admin', 'regional_admin'].includes(adminProfile.role)) {
        return res.status(403).json({ error: 'Unauthorized — admin access required' });
      }
    }

    // Update the approval_status
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        approval_status: action,
        approved_by: adminId || null,
        approved_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Fetch user info for notification
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, stakeholder_type')
      .eq('id', userId)
      .maybeSingle();

    // Create notification for the user
    const notifTitle = action === 'approved'
      ? 'Registration Approved'
      : 'Registration Declined';
    const notifMessage = action === 'approved'
      ? 'Your CertifyCX registration has been approved! You can now log in and access your dashboard.'
      : 'Your CertifyCX registration has been declined. Please contact support at mvpcertify@gmail.com for more information.';

    await supabaseAdmin.from('notifications').insert([{
      user_id: userId,
      type: 'system',
      title: notifTitle,
      message: notifMessage,
    }]);

    return res.status(200).json({
      success: true,
      action,
      user: userProfile?.full_name || userId,
    });
  } catch (error) {
    console.error('Approve registration error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
