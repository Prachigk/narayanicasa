// api/create-order.js
// Creates a Razorpay Order server-side. The Key Secret never touches the browser.
// Requires environment variables set in Vercel dashboard:
//   RAZORPAY_KEY_ID
//   RAZORPAY_KEY_SECRET

const Razorpay = require('razorpay');

module.exports = async (req, res) => {
  // CORS so narayanicasa.com can call this function
  res.setHeader('Access-Control-Allow-Origin', '*'); // tighten to https://narayanicasa.com once live
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const amountRupees = Number(req.body && req.body.amount);

    // Server-side sanity check on the amount - never trust the browser blindly.
    if (!amountRupees || amountRupees <= 0 || amountRupees > 200000) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amountRupees * 100), // paise
      currency: 'INR',
      receipt: 'narayanicasa_' + Date.now(),
      notes: {
        source: 'narayanicasa.com',
      },
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // public key id, safe to send to browser
    });
  } catch (err) {
    console.error('create-order error:', err);
    return res.status(500).json({ error: 'Could not create order' });
  }
};
