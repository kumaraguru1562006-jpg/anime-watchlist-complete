import mongoose from 'mongoose';

const watchlistItemSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  animeId: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  englishTitle: {
    type: String,
  },
  romajiTitle: {
    type: String,
  },
  coverImage: {
    type: String,
  },
  bannerImage: {
    type: String,
  },
  format: {
    type: String,
    default: 'TV',
  },
  status: {
    type: String,
    enum: ['plan_to_watch', 'watching', 'completed', 'dropped'],
    default: 'plan_to_watch',
  },
  episodesWatched: {
    type: Number,
    default: 0,
  },
  totalEpisodes: {
    type: Number,
    default: 0,
  },
  userScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 0,
  },
  userReview: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  genres: [
    {
      type: String,
    },
  ],
  year: {
    type: Number,
  },
  season: {
    type: String,
  },
  airingStatus: {
    type: String,
  },
  nextEpisodeAiringAt: {
    type: Number,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index to prevent duplicate watchlist entries for the same user + anime
watchlistItemSchema.index({ userId: 1, animeId: 1 }, { unique: true });

export const WatchlistItem = mongoose.models.WatchlistItem || mongoose.model('WatchlistItem', watchlistItemSchema);
