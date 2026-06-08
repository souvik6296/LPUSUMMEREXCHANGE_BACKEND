const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const supabase = require('../lib/supabase');

// GET /api/receipt/:receiptId
router.get('/:receiptId', verifyFirebaseToken, async (req, res) => {
  const { receiptId } = req.params;

  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', req.user.uid)
      .single();

    if (!user) return res.status(404).json({ error: 'User not found' });

    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('receipt_id', receiptId)
      .eq('user_id', user.id)
      .single();

    if (error || !enrollment) return res.status(404).json({ error: 'Receipt not found' });

    res.json({
      receiptId: enrollment.receipt_id,
      date: enrollment.updated_at,
      studentName: user.name,
      email: user.email,
      plan: enrollment.plan,
      courses: enrollment.courses,
      amount: enrollment.amount,
      paymentMethod: 'UPI',
      utr: enrollment.utr,
      status: enrollment.status,
    });
  } catch (error) {
    console.error('Receipt fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

module.exports = router;
