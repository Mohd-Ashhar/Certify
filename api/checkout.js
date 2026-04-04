import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { isoName, tier, isMonthly, price, applicationId, clientId } = req.body;

    const lineItem = {
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${isoName} - ${tier} Package`,
          description: isMonthly ? 'Monthly Subscription' : 'One-Time Payment',
        },
        unit_amount: Math.round(price * 100), // Stripe expects exact cents integer
      },
      quantity: 1,
    };

    if (isMonthly) {
      lineItem.price_data.recurring = {
        interval: 'month',
      };
    }

    const baseUrl = process.env.VITE_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://certify.cx');

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: isMonthly ? 'subscription' : 'payment',
      success_url: `${baseUrl}/client/dashboard?payment=success`,
      cancel_url: `${baseUrl}/client/checkout/${applicationId}?payment=cancelled`,
      metadata: {
        applicationId: applicationId,
        clientId: clientId,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Credit referral commission if this client was referred
    if (clientId) {
      try {
        // Find referral where this client's email matches referred_email
        const { data: userMeta } = await supabaseAdmin.auth.admin.getUserById(clientId);
        const clientEmail = userMeta?.user?.email;

        if (clientEmail) {
          const { data: referral } = await supabaseAdmin
            .from('referrals')
            .select('*')
            .eq('referred_email', clientEmail)
            .in('status', ['pending', 'signed_up'])
            .maybeSingle();

          if (referral) {
            const saleAmount = isMonthly ? price * 12 : price;
            const commission = saleAmount * 0.10; // 10% commission

            await supabaseAdmin
              .from('referrals')
              .update({
                status: 'converted',
                payment_amount: saleAmount,
                commission_amount: commission,
                referred_id: clientId,
                converted_at: new Date().toISOString(),
              })
              .eq('id', referral.id);
          }
        }
      } catch (refErr) {
        console.error('Referral commission error (non-blocking):', refErr);
      }
    }

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
