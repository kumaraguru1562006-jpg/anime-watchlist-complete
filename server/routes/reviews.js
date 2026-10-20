import express from 'express';
import { Review } from '../models/Review.js';
import { isMongoConnected, getLocalDb, saveLocalDb } from '../config/db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Initial seed reviews for great initial content
const seedReviews = [
  {
    _id: 'seed-rev-1',
    userId: 'seed_u1',
    userName: 'KuroNeko Otaku',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    animeId: 154587,
    animeTitle: 'Frieren: Beyond Journey\'s End',
    animeCover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    episodeNumber: 28,
    rating: 10,
    reviewTitle: 'A Masterclass in Melancholy and Visual Poetry',
    reviewText: 'The finale episode tied together every thematic thread of life, memory, and companionship. The orchestral score during the sunrise sequence gave me chills. Easily the defining fantasy anime of our era.',
    likes: 42,
    likedBy: [],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    _id: 'seed-rev-2',
    userId: 'seed_u2',
    userName: 'TanjiroFan2026',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    animeId: 142838,
    animeTitle: 'Jujutsu Kaisen: Culling Game Arc',
    animeCover: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    episodeNumber: 14,
    rating: 9,
    reviewTitle: 'MAPPA\'s Core Animation Crew Delivered Pure Cinema',
    reviewText: 'The hand-to-hand combat choreography in Episode 14 is insane. The lighting, domain expansion sequence, and sound design were peak quality. Cannot wait for next week!',
    likes: 38,
    likedBy: [],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    _id: 'seed-rev-3',
    userId: 'seed_u3',
    userName: 'Aanya Sen',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    animeId: 163132,
    animeTitle: 'Solo Leveling: Season 2',
    animeCover: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
    episodeNumber: 11,
    rating: 10,
    reviewTitle: 'The Jeju Island Raid Surpassed the Manhwa!',
    reviewText: 'When Jinwoo said "Arise", the entire theater and chat erupted. Sawano\'s vocal drop is goosebump-inducing. Best episode of the entire season without doubt.',
    likes: 65,
    likedBy: [],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

// Seed initial reviews if empty
const ensureSeedReviews = async () => {
  try {
    if (isMongoConnected) {
      const count = await Review.countDocuments();
      if (count === 0) {
        await Review.insertMany(seedReviews.map(r => ({
          ...r,
          _id: undefined,
          createdAt: new Date(r.createdAt),
        })));
      }
    } else {
      const db = getLocalDb();
      if (!db.reviews || db.reviews.length === 0) {
        db.reviews = [...seedReviews];
        saveLocalDb(db);
      }
    }
  } catch (err) {
    console.error('Error seeding initial reviews:', err);
  }
};

// GET /api/reviews
// Query params: ?animeId=123&episode=5&limit=20
router.get('/', optionalAuth, async (req, res) => {
  await ensureSeedReviews();
  const { animeId, episode, limit = 25 } = req.query;

  try {
    if (isMongoConnected) {
      const filter = {};
      if (animeId) filter.animeId = Number(animeId);
      if (episode) filter.episodeNumber = Number(episode);

      const reviews = await Review.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit));

      return res.json({ reviews });
    } else {
      const db = getLocalDb();
      let reviews = db.reviews || [];
      if (animeId) reviews = reviews.filter((r) => Number(r.animeId) === Number(animeId));
      if (episode) reviews = reviews.filter((r) => Number(r.episodeNumber) === Number(episode));

      reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ reviews: reviews.slice(0, Number(limit)) });
    }
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews
// Create an episode or series review
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userName = req.user.name;
    const userAvatar = req.user.avatar;
    const userEmail = req.user.email;

    const {
      animeId,
      animeTitle,
      animeCover,
      episodeNumber,
      rating,
      reviewTitle,
      reviewText,
    } = req.body;

    if (!animeId || !animeTitle || !rating || !reviewText) {
      return res.status(400).json({
        error: 'animeId, animeTitle, rating (1-10), and reviewText are required',
      });
    }

    const numRating = Math.max(1, Math.min(10, Number(rating)));
    const epNum = episodeNumber ? Number(episodeNumber) : null;

    if (isMongoConnected) {
      const newReview = await Review.create({
        userId,
        userName,
        userAvatar,
        userEmail,
        animeId: Number(animeId),
        animeTitle,
        animeCover,
        episodeNumber: epNum,
        rating: numRating,
        reviewTitle: reviewTitle || '',
        reviewText,
        likes: 0,
        likedBy: [],
        createdAt: new Date(),
      });

      return res.status(201).json({ success: true, review: newReview });
    } else {
      const db = getLocalDb();
      const newReview = {
        _id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        userName,
        userAvatar,
        userEmail,
        animeId: Number(animeId),
        animeTitle,
        animeCover,
        episodeNumber: epNum,
        rating: numRating,
        reviewTitle: reviewTitle || '',
        reviewText,
        likes: 0,
        likedBy: [],
        createdAt: new Date().toISOString(),
      };

      if (!db.reviews) db.reviews = [];
      db.reviews.unshift(newReview);
      saveLocalDb(db);

      return res.status(201).json({ success: true, review: newReview });
    }
  } catch (err) {
    console.error('Error posting review:', err);
    return res.status(500).json({ error: 'Failed to post review' });
  }
});

// POST /api/reviews/:id/like
// Like or unlike a review
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;

    if (isMongoConnected) {
      const review = await Review.findById(reviewId);
      if (!review) return res.status(404).json({ error: 'Review not found' });

      const hasLiked = review.likedBy.includes(userId);
      if (hasLiked) {
        review.likedBy = review.likedBy.filter((id) => id !== userId);
        review.likes = Math.max(0, review.likes - 1);
      } else {
        review.likedBy.push(userId);
        review.likes += 1;
      }

      await review.save();
      return res.json({ success: true, likes: review.likes, hasLiked: !hasLiked });
    } else {
      const db = getLocalDb();
      const review = db.reviews?.find((r) => r._id === reviewId || r.id === reviewId);
      if (!review) return res.status(404).json({ error: 'Review not found' });

      if (!review.likedBy) review.likedBy = [];
      const hasLiked = review.likedBy.includes(userId);
      if (hasLiked) {
        review.likedBy = review.likedBy.filter((id) => id !== userId);
        review.likes = Math.max(0, (review.likes || 1) - 1);
      } else {
        review.likedBy.push(userId);
        review.likes = (review.likes || 0) + 1;
      }

      saveLocalDb(db);
      return res.json({ success: true, likes: review.likes, hasLiked: !hasLiked });
    }
  } catch (err) {
    console.error('Error toggling review like:', err);
    return res.status(500).json({ error: 'Failed to update like' });
  }
});

export default router;
