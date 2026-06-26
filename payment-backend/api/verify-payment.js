// api/verify-payment.js
// Verifies that a payment really happened and wasn't faked by tampering with the browser.
// Requires environment variable: RAZORPAY_KEY_SECRET

const crypto = require('crypto');

module.exports = async (req, res) => {
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: 'Missing payment details' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    const verified = generatedSignature === razorpay_signature;

    return res.status(200).json({ verified });
  } catch (err) {
    console.error('verify-payment error:', err);
    return res.status(500).json({ verified: false, error: 'Verification failed' });
  }
};
