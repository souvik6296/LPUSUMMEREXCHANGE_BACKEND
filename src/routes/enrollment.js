const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const supabase = require('../lib/supabase');

const PLAN_PRICES = { basic: 600, explorer: 1000, best_value: 1400 };
const PLAN_COURSE_LIMITS = { basic: 1, explorer: 2, best_value: 3 };

// POST /api/enrollment/create
router.post('/create', verifyFirebaseToken, async (req, res) => {
  const { plan, courses } = req.body;

  if (!plan || !courses || !Array.isArray(courses)) {
    return res.status(400).json({ error: 'plan and courses array are required' });
  }

  const validPlans = ['basic', 'explorer', 'best_value'];
  if (!validPlans.includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  const maxCourses = PLAN_COURSE_LIMITS[plan];
  if (courses.length > maxCourses) {
    return res.status(400).json({ error: `Plan "${plan}" allows max ${maxCourses} course(s)` });
  }

  const amount = PLAN_PRICES[plan];

  try {
    // Find or create user
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', req.user.uid)
      .single();

    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          firebase_uid: req.user.uid,
          email: req.user.email,
          name: req.user.name || req.user.email.split('@')[0],
          photo_url: req.user.picture || null,
        })
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    }

    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        plan,
        courses,
        amount,
        status: 'pending_payment',
      })
      .select()
      .single();

    if (enrollError) throw enrollError;

    res.json({ success: true, enrollmentId: enrollment.id, amount });
  } catch (error) {
    console.error('Enrollment create error:', error.message);
    res.status(500).json({ error: 'Failed to create enrollment' });
  }
});

module.exports = router;
