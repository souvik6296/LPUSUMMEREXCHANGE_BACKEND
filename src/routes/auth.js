const express = require('express');
const router = express.Router();
const { initializeFirebase } = require('../middleware/auth');
const admin = require('firebase-admin');
const supabase = require('../lib/supabase');

// POST /api/auth/verify
router.post('/verify', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }

  try {
    let decodedToken;

    if (process.env.FIREBASE_PROJECT_ID) {
      initializeFirebase();
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } else {
      decodedToken = { uid: 'dev-uid', email: 'dev@example.com', name: 'Dev User', picture: null };
    }

    const name = decodedToken.name || decodedToken.email.split('@')[0];
    const photoUrl = decodedToken.picture || null;

    // Upsert user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        {
          firebase_uid: decodedToken.uid,
          email: decodedToken.email,
          name,
          photo_url: photoUrl,
        },
        { onConflict: 'firebase_uid' }
      )
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, user });
  } catch (error) {
    console.error('Auth verify error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
