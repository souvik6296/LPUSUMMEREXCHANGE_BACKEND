const express = require('express');
const router = express.Router();
const { sendSupportEmail } = require('../services/email');
const supabase = require('../lib/supabase');

// POST /api/support/contact
router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    // Save to Supabase
    const { error: dbError } = await supabase
      .from('support_tickets')
      .insert({ name, email, message });

    if (dbError) throw dbError;

    // Send email
    await sendSupportEmail({ name, email, message });

    res.json({ success: true, message: "Your message has been received. We'll get back to you within 24 hours." });
  } catch (error) {
    console.error('Support contact error:', error.message);
    res.status(500).json({ error: 'Failed to send message. Please try WhatsApp instead.' });
  }
});

module.exports = router;
