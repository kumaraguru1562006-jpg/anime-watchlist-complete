import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userAvatar: {
    type: String,
  },
  userEmail: {
    type: String,
  },
  animeId: {
    type: Number,
    required: true,
    index: true,
  },
  animeTitle: {
    type: String,
    required: true,
  },
  animeCover: {
    type: String,
  },
  episodeNumber: {
    type: Number,
    default: null, // null means general series review, number means episode-specific review
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: true,
  },
  reviewTitle: {
    type: String,
    default: '',
  },
  reviewText: {
    type: String,
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
