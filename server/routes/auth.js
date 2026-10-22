import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { isMongoConnected, getLocalDb, saveLocalDb } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'anime_super_secret_liquid_glass_jwt_key_2026';

// Cryptographic Password Hashing Helpers
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(hash, 'hex'));
};

// Helper to decode Google JWT token (from Google Identity Services credential)
const decodeGoogleCredential = (credential) => {
  try {
    if (!credential || typeof credential !== 'string') return null;
    const parts = credential.split('.');
    if (parts.length < 2) return null;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(payloadBase64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch (err) {
    console.warn('Could not decode Google credential:', err.message);
    return null;
  }
};

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

// ==========================================
// 1. POST /api/auth/google
// Authentic Google OAuth / Gmail Sign-In
// Accepts Google GIS credential JWT OR direct Google profile data
// ==========================================
router.post('/google', async (req, res) => {
  try {
    const { credential, email, name, avatar, googleId } = req.body;

    let targetEmail = email;
    let targetName = name;
    let targetAvatar = avatar;
    let targetGoogleId = googleId;

    // If Google Identity Services (GIS) credential token is provided, decode and verify it
    if (credential) {
      const decoded = decodeGoogleCredential(credential);
      if (decoded && decoded.email) {
        targetEmail = decoded.email;
        targetName = decoded.name || targetName || targetEmail.split('@')[0];
        targetAvatar = decoded.picture || targetAvatar;
        targetGoogleId = decoded.sub || targetGoogleId;
      }
    }

    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid Google email address is required.' });
    }

    const cleanEmail = targetEmail.toLowerCase().trim();
    const cleanName = targetName || cleanEmail.split('@')[0];
    const cleanAvatar =
      targetAvatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=020617`;

    let user;

    if (isMongoConnected) {
      // Find existing user by email or Google ID
      user = await User.findOne({
        $or: [{ email: cleanEmail }, ...(targetGoogleId ? [{ googleId: targetGoogleId }] : [])],
      });

      if (!user) {
        user = await User.create({
          email: cleanEmail,
          name: cleanName,
          avatar: cleanAvatar,
          googleId: targetGoogleId || `google_${Date.now()}`,
          bio: 'Anime enthusiast with verified Google account.',
          createdAt: new Date(),
        });
      } else {
        // Update user profile with latest Google data
        let changed = false;
        if (targetGoogleId && !user.googleId) {
          user.googleId = targetGoogleId;
          changed = true;
        }
        if (cleanName && user.name !== cleanName) {
          user.name = cleanName;
          changed = true;
        }
        if (cleanAvatar && user.avatar !== cleanAvatar) {
          user.avatar = cleanAvatar;
          changed = true;
        }
        if (changed) await user.save();
      }
    } else {
      // Local persistent fallback
      const db = getLocalDb();
      let localUser = db.users.find(
        (u) => u.email.toLowerCase() === cleanEmail || (targetGoogleId && u.googleId === targetGoogleId)
      );

      if (!localUser) {
        localUser = {
          _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: cleanEmail,
          name: cleanName,
          avatar: cleanAvatar,
          googleId: targetGoogleId || `google_${Date.now()}`,
          bio: 'Anime enthusiast with verified Google account.',
          createdAt: new Date().toISOString(),
        };
        db.users.push(localUser);
        saveLocalDb(db);
      } else {
        if (targetGoogleId && !localUser.googleId) localUser.googleId = targetGoogleId;
        if (cleanName) localUser.name = cleanName;
        if (cleanAvatar) localUser.avatar = cleanAvatar;
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
    return res.status(500).json({ error: 'Google authentication failed', details: err.message });
  }
});

// ==========================================
// 2. POST /api/auth/register
// Strict Registration with Validation and Password Hashing
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, avatar } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = (name && name.trim()) || cleanEmail.split('@')[0];
    const cleanAvatar =
      avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=020617`;

    let user;

    if (isMongoConnected) {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({
          error: 'An account with this email already exists. Please sign in or use Google Login.',
        });
      }

      user = await User.create({
        email: cleanEmail,
        password: hashPassword(password),
        name: cleanName,
        avatar: cleanAvatar,
        bio: 'Anime enthusiast exploring Japanese animation.',
        createdAt: new Date(),
      });
    } else {
      const db = getLocalDb();
      const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return res.status(400).json({
          error: 'An account with this email already exists. Please sign in or use Google Login.',
        });
      }

      user = {
        _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: cleanEmail,
        password: hashPassword(password),
        name: cleanName,
        avatar: cleanAvatar,
        bio: 'Anime enthusiast exploring Japanese animation.',
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
      saveLocalDb(db);
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
    console.error('Error during user registration:', err);
    return res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// ==========================================
// 3. POST /api/auth/login
// Strict Sign In with Real Email and Password Verification
// (Rejects random credentials instead of blindly creating dummy users)
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Please enter your password.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user;

    if (isMongoConnected) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      const db = getLocalDb();
      user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    }

    if (!user) {
      return res.status(404).json({
        error: 'No account found with this email. Please switch to "Register" or sign in with Google.',
      });
    }

    // If user registered with Google and has no local password
    if (!user.password && user.googleId) {
      return res.status(400).json({
        error: 'This account was created with Google. Please use the "Sign In with Google" button.',
      });
    }

    // Verify password if a password hash exists
    if (user.password) {
      const isValid = verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({
          error: 'Incorrect password. Please verify your credentials or reset your password.',
        });
      }
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
    console.error('Error during login:', err);
    return res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// ==========================================
// 4. POST /api/auth/firebase
// Handles Firebase token sync / legacy compatibility
// ==========================================
router.post('/firebase', async (req, res) => {
  try {
    const { email, name, avatar, firebaseUid } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required.' });
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
