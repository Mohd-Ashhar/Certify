import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { email, interest, source, userId } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if this email already submitted a lead
    const { data: existing } = await supabaseAdmin
      .from('sara_leads')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      // Update interest if they submit again
      await supabaseAdmin
        .from('sara_leads')
        .update({ interest, source: source || 'landing_page' })
        .eq('id', existing.id);

      return res.status(200).json({ success: true, message: 'Lead updated' });
    }

    const { error: insertError } = await supabaseAdmin
      .from('sara_leads')
      .insert({
        email,
        interest: interest || null,
        source: source || 'landing_page',
        user_id: userId || null,
      });

    if (insertError) throw insertError;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Sara lead capture error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
