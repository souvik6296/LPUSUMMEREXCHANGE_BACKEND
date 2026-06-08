const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const supabase = require('../lib/supabase');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const userEmail = req.user.email?.toLowerCase();

  if (!userEmail || !adminEmails.includes(userEmail)) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// GET /api/admin/enrollments
router.get('/enrollments', verifyFirebaseToken, isAdmin, async (req, res) => {
  try {
    // Get enrollments that are pending verification
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        users ( name, email )
      `)
      .eq('status', 'pending_verification')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Map to a flatter structure for frontend
    const formatted = enrollments.map(e => ({
      id: e.id,
      receiptId: e.receipt_id,
      date: e.updated_at,
      plan: e.plan,
      courses: e.courses,
      amount: e.amount,
      utr: e.utr,
      studentName: e.users?.name,
      studentEmail: e.users?.email,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Admin fetch enrollments error:', error.message);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// POST /api/admin/verify
router.post('/verify', verifyFirebaseToken, isAdmin, async (req, res) => {
  const { enrollmentId } = req.body;

  if (!enrollmentId) {
    return res.status(400).json({ error: 'enrollmentId is required' });
  }

  try {
    const { data, error } = await supabase
      .from('enrollments')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentId)
      .eq('status', 'pending_verification')
      .select()
      .single();

    if (error || !data) {
      return res.status(400).json({ error: 'Failed to verify. Enrollment might already be active or not found.' });
    }

    res.json({ success: true, message: 'Payment verified and enrollment activated.' });
  } catch (error) {
    console.error('Admin verify error:', error.message);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

module.exports = router;
