import express from 'express';
import axios from 'axios';
import { WatchlistItem } from '../models/WatchlistItem.js';
import { User } from '../models/User.js';
import { isMongoConnected, getLocalDb, saveLocalDb } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/watchlist
// Query params: ?status=plan_to_watch | completed | watching | pinned | all
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    if (isMongoConnected) {
      const query = { userId };
      if (status && status !== 'all') {
        if (status === 'pinned') {
          query.isPinned = true;
        } else {
          query.status = status;
        }
      }
      const items = await WatchlistItem.find(query).sort({ isPinned: -1, updatedAt: -1 });
      return res.json({ items });
    } else {
      const db = getLocalDb();
      let items = db.watchlist.filter((item) => item.userId === userId);
      if (status && status !== 'all') {
        if (status === 'pinned') {
          items = items.filter((item) => item.isPinned === true);
        } else {
          items = items.filter((item) => item.status === status);
        }
      }
      items.sort((a, b) => {
        if (Boolean(b.isPinned) !== Boolean(a.isPinned)) {
          return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
        }
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
      return res.json({ items });
    }
  } catch (err) {
    console.error('Error fetching watchlist:', err);
    return res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// GET /api/watchlist/stats
// Quick summary stats for the current user
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongoConnected) {
      const items = await WatchlistItem.find({ userId });
      const planToWatchCount = items.filter((i) => i.status === 'plan_to_watch').length;
      const completedCount = items.filter((i) => i.status === 'completed').length;
      const watchingCount = items.filter((i) => i.status === 'watching').length;
      const droppedCount = items.filter((i) => i.status === 'dropped').length;
      const pinnedCount = items.filter((i) => i.isPinned === true).length;

      const totalEpisodesWatched = items.reduce((acc, i) => acc + (i.episodesWatched || 0), 0);
      const ratedItems = items.filter((i) => i.userScore > 0);
      const averageScore = ratedItems.length > 0
        ? (ratedItems.reduce((acc, i) => acc + i.userScore, 0) / ratedItems.length).toFixed(1)
        : '0.0';

      return res.json({
        total: items.length,
        planToWatchCount,
        completedCount,
        watchingCount,
        droppedCount,
        pinnedCount,
        totalEpisodesWatched,
        averageScore,
      });
    } else {
      const db = getLocalDb();
      const items = db.watchlist.filter((item) => item.userId === userId);
      const planToWatchCount = items.filter((i) => i.status === 'plan_to_watch').length;
      const completedCount = items.filter((i) => i.status === 'completed').length;
      const watchingCount = items.filter((i) => i.status === 'watching').length;
      const droppedCount = items.filter((i) => i.status === 'dropped').length;
      const pinnedCount = items.filter((i) => i.isPinned === true).length;

      const totalEpisodesWatched = items.reduce((acc, i) => acc + (i.episodesWatched || 0), 0);
      const ratedItems = items.filter((i) => i.userScore > 0);
      const averageScore = ratedItems.length > 0
        ? (ratedItems.reduce((acc, i) => acc + i.userScore, 0) / ratedItems.length).toFixed(1)
        : '0.0';

      return res.json({
        total: items.length,
        planToWatchCount,
        completedCount,
        watchingCount,
        droppedCount,
        pinnedCount,
        totalEpisodesWatched,
        averageScore,
      });
    }
  } catch (err) {
    console.error('Error fetching watchlist stats:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/watchlist/public/:userId
// Public endpoint for sharing user's watched list (no auth required)
router.get('/public/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    let targetUser = null;
    let completedItems = [];

    if (isMongoConnected) {
      targetUser = await User.findById(userId).select('name avatar email createdAt');
      completedItems = await WatchlistItem.find({ userId, status: 'completed' }).sort({ updatedAt: -1 });
    } else {
      const db = getLocalDb();
      targetUser = (db.users || []).find((u) => u._id === userId || u.id === userId);
      completedItems = (db.watchlist || []).filter(
        (item) => item.userId === userId && item.status === 'completed'
      );
      completedItems.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    if (!targetUser && completedItems.length === 0) {
      return res.status(404).json({ error: 'Shared watched list not found or is empty' });
    }

    const totalEpisodesWatched = completedItems.reduce((acc, i) => acc + (i.episodesWatched || i.totalEpisodes || 0), 0);
    const ratedItems = completedItems.filter((i) => i.userScore > 0);
    const averageScore = ratedItems.length > 0
      ? (ratedItems.reduce((acc, i) => acc + i.userScore, 0) / ratedItems.length).toFixed(1)
      : '0.0';

    return res.json({
      success: true,
      user: {
        id: userId,
        name: targetUser ? targetUser.name : 'Anime Fan',
        avatar: targetUser ? targetUser.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      },
      stats: {
        completedCount: completedItems.length,
        totalEpisodesWatched,
        averageScore,
      },
      items: completedItems,
    });
  } catch (err) {
    console.error('Error fetching public watched list:', err);
    return res.status(500).json({ error: 'Failed to fetch public watched list' });
  }
});

// POST /api/watchlist
// Add or update an anime in user's watchlist
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      animeId,
      title,
      englishTitle,
      romajiTitle,
      coverImage,
      bannerImage,
      format,
      status, // 'plan_to_watch' | 'completed' | 'watching'
      episodesWatched,
      totalEpisodes,
      userScore,
      notes,
      genres,
      year,
      season,
      airingStatus,
      isPinned,
    } = req.body;

    if (!animeId || !title) {
      return res.status(400).json({ error: 'animeId and title are required' });
    }

    const itemStatus = status || 'plan_to_watch';

    if (isMongoConnected) {
      const existing = await WatchlistItem.findOne({ userId, animeId });

      if (existing) {
        existing.status = itemStatus;
        if (episodesWatched !== undefined) existing.episodesWatched = episodesWatched;
        if (totalEpisodes !== undefined) existing.totalEpisodes = totalEpisodes;
        if (userScore !== undefined) existing.userScore = userScore;
        if (notes !== undefined) existing.notes = notes;
        if (isPinned !== undefined) existing.isPinned = Boolean(isPinned);
        existing.updatedAt = new Date();
        await existing.save();
        return res.json({ success: true, item: existing, updated: true });
      }

      const newItem = await WatchlistItem.create({
        userId,
        animeId,
        title,
        englishTitle: englishTitle || title,
        romajiTitle: romajiTitle || title,
        coverImage,
        bannerImage,
        format: format || 'TV',
        status: itemStatus,
        episodesWatched: episodesWatched || (itemStatus === 'completed' ? totalEpisodes || 12 : 0),
        totalEpisodes: totalEpisodes || 0,
        userScore: userScore || 0,
        notes: notes || '',
        genres: genres || [],
        year,
        season,
        airingStatus,
        isPinned: Boolean(isPinned) || false,
        updatedAt: new Date(),
      });

      return res.status(201).json({ success: true, item: newItem, created: true });
    } else {
      // Local DB fallback
      const db = getLocalDb();
      const existingIndex = db.watchlist.findIndex(
        (i) => i.userId === userId && Number(i.animeId) === Number(animeId)
      );

      if (existingIndex >= 0) {
        const item = db.watchlist[existingIndex];
        item.status = itemStatus;
        if (episodesWatched !== undefined) item.episodesWatched = episodesWatched;
        if (totalEpisodes !== undefined) item.totalEpisodes = totalEpisodes;
        if (userScore !== undefined) item.userScore = userScore;
        if (notes !== undefined) item.notes = notes;
        if (isPinned !== undefined) item.isPinned = Boolean(isPinned);
        item.updatedAt = new Date().toISOString();
        db.watchlist[existingIndex] = item;
        saveLocalDb(db);
        return res.json({ success: true, item, updated: true });
      }

      const newItem = {
        _id: `wl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        animeId: Number(animeId),
        title,
        englishTitle: englishTitle || title,
        romajiTitle: romajiTitle || title,
        coverImage,
        bannerImage,
        format: format || 'TV',
        status: itemStatus,
        episodesWatched: episodesWatched || (itemStatus === 'completed' ? totalEpisodes || 12 : 0),
        totalEpisodes: totalEpisodes || 0,
        userScore: userScore || 0,
        notes: notes || '',
        genres: genres || [],
        year,
        season,
        airingStatus,
        isPinned: Boolean(isPinned) || false,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      db.watchlist.push(newItem);
      saveLocalDb(db);
      return res.status(201).json({ success: true, item: newItem, created: true });
    }
  } catch (err) {
    console.error('Error modifying watchlist item:', err);
    return res.status(500).json({ error: 'Failed to save watchlist item' });
  }
});

// PUT /api/watchlist/:animeId
// Update status, progress, score, notes, isPinned
router.put('/:animeId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const animeId = Number(req.params.animeId);
    const { status, episodesWatched, userScore, notes, isPinned } = req.body;

    if (isMongoConnected) {
      const item = await WatchlistItem.findOne({ userId, animeId });
      if (!item) {
        return res.status(404).json({ error: 'Watchlist item not found' });
      }

      if (status !== undefined) item.status = status;
      if (episodesWatched !== undefined) item.episodesWatched = episodesWatched;
      if (userScore !== undefined) item.userScore = userScore;
      if (notes !== undefined) item.notes = notes;
      if (isPinned !== undefined) item.isPinned = Boolean(isPinned);
      item.updatedAt = new Date();

      await item.save();
      return res.json({ success: true, item });
    } else {
      const db = getLocalDb();
      const itemIndex = db.watchlist.findIndex(
        (i) => i.userId === userId && Number(i.animeId) === animeId
      );

      if (itemIndex === -1) {
        return res.status(404).json({ error: 'Watchlist item not found' });
      }

      const item = db.watchlist[itemIndex];
      if (status !== undefined) item.status = status;
      if (episodesWatched !== undefined) item.episodesWatched = episodesWatched;
      if (userScore !== undefined) item.userScore = userScore;
      if (notes !== undefined) item.notes = notes;
      if (isPinned !== undefined) item.isPinned = Boolean(isPinned);
      item.updatedAt = new Date().toISOString();

      db.watchlist[itemIndex] = item;
      saveLocalDb(db);
      return res.json({ success: true, item });
    }
  } catch (err) {
    console.error('Error updating watchlist item:', err);
    return res.status(500).json({ error: 'Failed to update watchlist item' });
  }
});

// PUT /api/watchlist/:animeId/pin
// Toggle or set pinned status for an anime
router.put('/:animeId/pin', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const animeId = Number(req.params.animeId);
    const { isPinned } = req.body;

    if (isMongoConnected) {
      let item = await WatchlistItem.findOne({ userId, animeId });
      if (!item) {
        return res.status(404).json({ error: 'Watchlist item not found' });
      }

      item.isPinned = isPinned !== undefined ? Boolean(isPinned) : !item.isPinned;
      item.updatedAt = new Date();
      await item.save();
      return res.json({ success: true, item });
    } else {
      const db = getLocalDb();
      const itemIndex = db.watchlist.findIndex(
        (i) => i.userId === userId && Number(i.animeId) === animeId
      );

      if (itemIndex === -1) {
        return res.status(404).json({ error: 'Watchlist item not found' });
      }

      const item = db.watchlist[itemIndex];
      item.isPinned = isPinned !== undefined ? Boolean(isPinned) : !item.isPinned;
      item.updatedAt = new Date().toISOString();

      db.watchlist[itemIndex] = item;
      saveLocalDb(db);
      return res.json({ success: true, item });
    }
  } catch (err) {
    console.error('Error toggling pin status:', err);
    return res.status(500).json({ error: 'Failed to update pin status' });
  }
});

// DELETE /api/watchlist/:animeId
// Remove anime from watchlist
router.delete('/:animeId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const animeId = Number(req.params.animeId);

    if (isMongoConnected) {
      const result = await WatchlistItem.findOneAndDelete({ userId, animeId });
      if (!result) {
        return res.status(404).json({ error: 'Item not found in watchlist' });
      }
      return res.json({ success: true, message: 'Removed from watchlist' });
    } else {
      const db = getLocalDb();
      const initialLength = db.watchlist.length;
      db.watchlist = db.watchlist.filter(
        (i) => !(i.userId === userId && Number(i.animeId) === animeId)
      );
      if (db.watchlist.length === initialLength) {
        return res.status(404).json({ error: 'Item not found in watchlist' });
      }
      saveLocalDb(db);
      return res.json({ success: true, message: 'Removed from watchlist' });
    }
  } catch (err) {
    console.error('Error removing from watchlist:', err);
    return res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

export default router;
