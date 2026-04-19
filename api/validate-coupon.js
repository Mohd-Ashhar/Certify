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
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, error: 'Missing code' });
    }

    const normalized = code.trim().toUpperCase();

    const { data: coupon, error } = await supabaseAdmin
      .from('discount_coupons')
      .select('*')
      .ilike('code', normalized)
      .maybeSingle();

    if (error) throw error;
    if (!coupon) {
      return res.status(200).json({ valid: false, reason: 'not_found' });
    }

    if (!coupon.is_active) {
      return res.status(200).json({ valid: false, reason: 'inactive' });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(200).json({ valid: false, reason: 'expired' });
    }

    if (
      coupon.max_redemptions != null &&
      (coupon.redemption_count || 0) >= coupon.max_redemptions
    ) {
      return res.status(200).json({ valid: false, reason: 'exhausted' });
    }

    return res.status(200).json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_percent: Number(coupon.discount_percent),
        description: coupon.description,
      },
    });
  } catch (err) {
    console.error('Validate coupon error:', err);
    return res.status(500).json({ valid: false, error: err.message || 'Internal Server Error' });
  }
}
