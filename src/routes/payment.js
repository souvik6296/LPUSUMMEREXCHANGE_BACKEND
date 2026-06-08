const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { sendEnrollmentConfirmation } = require('../services/email');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');

// POST /api/payment/submit
router.post('/submit', verifyFirebaseToken, async (req, res) => {
  const { enrollmentId, utr } = req.body;

  if (!enrollmentId || !utr) {
    return res.status(400).json({ error: 'enrollmentId and utr are required' });
  }

  if (!/^\d{12}$/.test(utr)) {
    return res.status(400).json({ error: 'UTR must be exactly 12 digits' });
  }

  try {
    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', req.user.uid)
      .single();

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .eq('user_id', user.id)
      .single();

    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    if (enrollment.utr) return res.status(400).json({ error: 'UTR already submitted for this enrollment' });

    const receiptId = `LPUSE-${uuidv4().toUpperCase().slice(0, 8)}`;

    const { data: updated, error: updateError } = await supabase
      .from('enrollments')
      .update({
        utr,
        status: 'pending_verification',
        receipt_id: receiptId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Send confirmation email (non-blocking)
    sendEnrollmentConfirmation({
      to: user.email,
      name: user.name,
      plan: enrollment.plan,
      courses: enrollment.courses,
      amount: enrollment.amount,
      utr,
      receiptId,
    }).catch(err => console.error('Email send failed:', err.message));

    res.json({ success: true, receiptId, status: 'pending_verification' });
  } catch (error) {
    console.error('Payment submit error:', error.message);
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});

module.exports = router;
