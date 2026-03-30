const express = require("express");
const Stripe = require("stripe");

const router = express.Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

router.post('/create-payment-intent', async (req, res) => {
  if (!stripeSecretKey) {
    return res.status(500).json({
      success: false,
      message: 'Stripe secret key is not configured on server.',
    });
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items provided.' });
    }

    const amount = items.reduce((sum, item) => {
      const price = Math.max(0, Number(item.price || 0));
      const quantity = Math.max(1, Math.round(Number(item.quantity || 1)));
      return sum + Math.round(price * 100) * quantity;
    }, 0);

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Order amount is invalid.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'inr',
      automatic_payment_methods: { enabled: true },
    });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment intent.',
      error: error.message,
    });
  }
});

router.post("/create-checkout-session", async (req, res) => {
  if (!stripeSecretKey) {
    return res.status(500).json({
      success: false,
      message: "Stripe secret key is not configured on server.",
    });
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    const { items, customer, successUrl, cancelUrl } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No order items provided." });
    }

    const lineItems = items
      .map((item) => {
        const unitAmount = Math.max(0, Math.round(Number(item.price || 0) * 100));
        const quantity = Math.max(1, Math.round(Number(item.quantity || 1)));
        const name = String(item.name || "Product").trim();

        if (!unitAmount || !name) {
          return null;
        }

        return {
          price_data: {
            currency: "inr",
            product_data: {
              name,
              description: `${String(item.color || "Default")} / ${String(item.size || "One Size")}`,
            },
            unit_amount: unitAmount,
          },
          quantity,
        };
      })
      .filter(Boolean);

    if (lineItems.length === 0) {
      return res.status(400).json({ success: false, message: "Order items are invalid." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      customer_email: customer?.email || undefined,
      metadata: {
        customerName: String(customer?.name || "").slice(0, 100),
        customerPhone: String(customer?.phone || "").slice(0, 25),
        address: String(customer?.address || "").slice(0, 450),
      },
      success_url: String(successUrl || "http://localhost:3000/order-details?paymentStatus=success"),
      cancel_url: String(cancelUrl || "http://localhost:3000/order-details?paymentStatus=cancelled"),
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create Stripe checkout session.",
      error: error.message,
    });
  }
});

module.exports = router;
