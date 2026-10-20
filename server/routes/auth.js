import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { isMongoConnected, getLocalDb, saveLocalDb } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'anime_super_secret_liquid_glass_jwt_key_2026';

// Helper to sign JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// POST /api/auth/google
// Accepts Google credential or direct user profile
router.post('/google', async (req, res) => {
  try {
    const { email, name, avatar, googleId, credential } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Google email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name || cleanEmail.split('@')[0];
    const cleanAvatar =
      avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=020617`;

    let user;

    if (isMongoConnected) {
      user = await User.findOne({ email: cleanEmail });
      if (!user) {
        user = await User.create({
          email: cleanEmail,
          name: cleanName,
          avatar: cleanAvatar,
          googleId: googleId || `google_${Date.now()}`,
        });
      } else {
        // Optionally update name/avatar if provided
        if (cleanName && user.name !== cleanName) user.name = cleanName;
        if (avatar && user.avatar !== cleanAvatar) user.avatar = cleanAvatar;
        await user.save();
      }
    } else {
      // Local DB fallback
      const db = getLocalDb();
      let localUser = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!localUser) {
        localUser = {
          _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: cleanEmail,
          name: cleanName,
          avatar: cleanAvatar,
          googleId: googleId || `google_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        db.users.push(localUser);
        saveLocalDb(db);
      } else {
        if (cleanName) localUser.name = cleanName;
        if (avatar) localUser.avatar = cleanAvatar;
        saveLocalDb(db);
      }
      user = localUser;
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Error during Google authentication:', err);
    return res.status(500).json({ error: 'Authentication failed', details: err.message });
  }
});

// POST /api/auth/firebase
// Handles Firebase email sign-in / registration
router.post('/firebase', async (req, res) => {
  try {
    const { email, name, avatar, firebaseUid } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name || cleanEmail.split('@')[0];
    const cleanAvatar =
      avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=020617`;

    let user;

    if (isMongoConnected) {
      user = await User.findOne({ email: cleanEmail });
      if (!user) {
        user = await User.create({
          email: cleanEmail,
          name: cleanName,
          avatar: cleanAvatar,
          firebaseUid: firebaseUid || `firebase_${Date.now()}`,
          createdAt: new Date(),
        });
      } else {
        if (cleanName && !user.name) user.name = cleanName;
        if (firebaseUid && !user.firebaseUid) user.firebaseUid = firebaseUid;
        await user.save();
      }
    } else {
      const db = getLocalDb();
      let localUser = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!localUser) {
        localUser = {
          _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: cleanEmail,
          name: cleanName,
          avatar: cleanAvatar,
          firebaseUid: firebaseUid || `firebase_${Date.now()}`,
          bio: 'Anime enthusiast exploring Japanese animation.',
          createdAt: new Date().toISOString(),
        };
        db.users.push(localUser);
        saveLocalDb(db);
      } else {
        if (cleanName && (!localUser.name || localUser.name === cleanEmail.split('@')[0])) {
          localUser.name = cleanName;
        }
        if (firebaseUid) localUser.firebaseUid = firebaseUid;
        saveLocalDb(db);
      }
      user = localUser;
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Error during Firebase authentication:', err);
    return res.status(500).json({ error: 'Firebase authentication failed', details: err.message });
  }
});

// PUT /api/auth/profile
// Allows authenticated users to update their profile (display name, avatar, bio)
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, avatar, bio } = req.body;

    let user;

    if (isMongoConnected) {
      user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (name && name.trim()) user.name = name.trim();
      if (avatar && avatar.trim()) user.avatar = avatar.trim();
      if (typeof bio === 'string') user.bio = bio.trim();
      await user.save();
    } else {
      const db = getLocalDb();
      user = db.users.find((u) => u._id === userId || u.id === userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (name && name.trim()) user.name = name.trim();
      if (avatar && avatar.trim()) user.avatar = avatar.trim();
      if (typeof bio === 'string') user.bio = bio.trim();
      saveLocalDb(db);
    }

    return res.json({
      success: true,
      user: {
        id: user._id || user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    return res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    let user;

    if (isMongoConnected) {
      user = await User.findById(userId);
    } else {
      const db = getLocalDb();
      user = db.users.find((u) => u._id === userId || u.id === userId);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: user._id || user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Error fetching current user:', err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
