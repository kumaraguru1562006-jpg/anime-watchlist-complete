import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { connectDB, isMongoConnected } from './config/db.js';
import authRoutes from './routes/auth.js';
import watchlistRoutes from './routes/watchlist.js';
import animeRoutes from './routes/anime.js';
import newsRoutes from './routes/news.js';
import chatRoutes from './routes/chat.js';
import { syncService } from './services/syncService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/chat', chatRoutes);

// Direct ZIP Download Routes (Browser 1-Click Download)
const handleDirectZipDownload = (req, res) => {
  const candidatePaths = [
    path.resolve(__dirname, 'anime-watchlist-complete.zip'),
    path.resolve(__dirname, '../anime-watchlist-complete.zip'),
    path.resolve(__dirname, '../client/public/anime-watchlist-complete.zip'),
    path.resolve('C:/Users/vivek/.gemini/antigravity/brain/782ae5be-e6b5-4f09-96de-85d6baf23351/anime-watchlist-complete.zip'),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="anime-watchlist-complete.zip"');
      return res.download(p, 'anime-watchlist-complete.zip');
    }
  }

  return res.status(404).json({ error: 'Zip file not found on server.' });
};

app.get('/download', handleDirectZipDownload);
app.get('/download-zip', handleDirectZipDownload);
app.get('/api/download', handleDirectZipDownload);
app.get('/api/download-zip', handleDirectZipDownload);
app.get('/anime-watchlist-complete.zip', handleDirectZipDownload);

// Health check endpoint with IST time
app.get('/api/health', (req, res) => {
  const istTime = new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const istDate = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  res.json({
    status: 'ok',
    message: 'Anime Watchlist Platform API is operational',
    currentISTTime: istTime,
    currentISTDate: istDate,
    timeZone: 'Asia/Kolkata (IST - UTC+5:30)',
    autoSync: syncService.getStatus(),
    database: {
      type: 'MongoDB',
      connected: isMongoConnected,
      storageMode: isMongoConnected ? 'Live MongoDB Server' : 'Persistent Storage Fallback',
    },
  });
});

app.get('/api/system/sync-status', (req, res) => {
  res.json(syncService.getStatus());
});

app.post('/api/system/sync-now', async (req, res) => {
  const result = await syncService.triggerSync('manual-admin-trigger');
  res.json(result);
});

// Direct Project ZIP Download endpoint for GitHub/backup
app.get('/api/download/project', (req, res) => {
  const zipFile = path.join(__dirname, '..', 'anime-watchlist-complete.zip');
  if (fs.existsSync(zipFile)) {
    return res.download(zipFile, 'anicart-platform-complete.zip');
  }
  return res.status(404).json({ error: 'Zip file not found' });
});

// Serve frontend build from client/dist if it exists
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Graceful root endpoint when frontend dist is not mounted (prevents "Cannot GET /" error)
  app.get('/', (req, res) => {
    res.json({
      name: 'AniCart API',
      status: 'online',
      message: 'AniCart Backend API is running successfully.',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        airingIST: '/api/anime/airing',
        news: '/api/news',
        watchlist: '/api/watchlist',
        auth: '/api/auth'
      }
    });
  });
}

// Start Server conditionally (only call listen in standalone mode, not in Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [AniSphere Fullstack] Running on port ${PORT} (0.0.0.0)`);
    console.log(`🕒 [IST Clock] Indian Standard Time initialized: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    syncService.startDailyScheduler();
    connectDB().catch((err) => console.error('DB connect error:', err));
  });
} else {
  connectDB().catch((err) => console.error('DB connect error in serverless:', err));
}

export default app;
export { app };
