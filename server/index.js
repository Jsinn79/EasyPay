require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - allow the Vite frontend on localhost:5173
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// ---------------------------------------------------------------------------
// Our own fee: charge $5 via a Stripe Checkout Session to *our* Stripe account
// ---------------------------------------------------------------------------

// Our own Stripe account (the one collecting the fee)
const ourStripe = new Stripe(process.env.OUR_STRIPE_SECRET_KEY);

/**
 * POST /api/create-checkout-session
 * Creates a Stripe Checkout Session for the $5 fee.
 * On success, redirects the user to Stripe Checkout.
 */
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const session = await ourStripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'EasyPay - Create a Payment Link',
              description: 'One-time fee to create a shareable Stripe payment link',
            },
            unit_amount: 500, // $5.00 in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/wizard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ error: 'Failed to create checkout session', details: err.message });
  }
});

/**
 * GET /api/check-payment-status?session_id=xxx
 * Check if a Checkout Session was paid.
 */
app.get('/api/check-payment-status', async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ error: 'Missing session_id parameter' });
    }
    const session = await ourStripe.checkout.sessions.retrieve(session_id);
    res.json({
      paid: session.payment_status === 'paid',
      status: session.status,
      paymentStatus: session.payment_status,
    });
  } catch (err) {
    console.error('Error checking payment status:', err);
    res.status(500).json({ error: 'Failed to check payment status', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// Payment link creation — uses the USER's Stripe secret key
// ---------------------------------------------------------------------------

/**
 * POST /api/create-payment-link
 * Creates a product, price, and payment link in the user's Stripe account.
 * Body: { stripeSecretKey, productName, priceAmount (in cents) }
 */
app.post('/api/create-payment-link', async (req, res) => {
  try {
    const { stripeSecretKey, productName, priceAmount } = req.body;

    if (!stripeSecretKey || !productName || !priceAmount) {
      return res.status(400).json({
        error: 'Missing required fields: stripeSecretKey, productName, priceAmount',
      });
    }

    // Create a Stripe instance scoped to the user's key
    const userStripe = new Stripe(stripeSecretKey);

    // Step 1: Create a product
    const product = await userStripe.products.create({
      name: productName,
    });

    // Step 2: Create a price (amount in cents)
    const price = await userStripe.prices.create({
      product: product.id,
      unit_amount: priceAmount,
      currency: 'usd',
    });

    // Step 3: Create a payment link
    const paymentLink = await userStripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
    });

    res.json({
      success: true,
      productId: product.id,
      priceId: price.id,
      paymentLinkUrl: paymentLink.url,
    });
  } catch (err) {
    console.error('Error creating payment link:', err);
    res.status(500).json({
      error: 'Failed to create payment link',
      details: err.message,
      type: err.type,
    });
  }
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EasyPay server running on http://0.0.0.0:${PORT}`);
});