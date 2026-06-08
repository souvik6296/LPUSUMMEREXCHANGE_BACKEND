const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const supabase = require('../lib/supabase');

// GET /api/user/profile
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', req.user.uid)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (enrollError) throw enrollError;

    res.json({ user, enrollments: enrollments || [] });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
