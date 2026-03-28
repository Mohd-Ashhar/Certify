import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Typical recent api version
});

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
        unit_amount: price * 100, // Stripe expects cents
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

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
