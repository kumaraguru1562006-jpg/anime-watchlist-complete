import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Heart, 
  MessageSquare, 
  Plus, 
  Sparkles, 
  Tv, 
  Check, 
  Filter, 
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const EpisodeReviewsSection = () => {
  const { user, openAuthModal } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    animeTitle: '',
    animeId: '',
    episodeNumber: '',
    rating: 10,
    reviewTitle: '',
    reviewText: '',
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await api.getReviews();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reviewId) => {
    if (!user) {
      openAuthModal();
      return;
    }

    try {
      const res = await api.likeReview(reviewId);
      setReviews((prev) =>
        prev.map((r) => {
          if (r._id === reviewId || r.id === reviewId) {
            return {
              ...r,
              likes: res.likes,
              likedBy: res.hasLiked
                ? [...(r.likedBy || []), user.id]
                : (r.likedBy || []).filter((id) => id !== user.id),
            };
          }
          return r;
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenWrite = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setFormData({
      animeTitle: 'Solo Leveling: Season 2',
      animeId: 163132,
      episodeNumber: 12,
      rating: 9,
      reviewTitle: '',
      reviewText: '',
    });
    setFormError('');
    setIsWriteModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formData.animeTitle || !formData.reviewText) {
      setFormError('Please enter anime title and review content');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await api.postReview({
        animeId: formData.animeId || Math.floor(Math.random() * 100000),
        animeTitle: formData.animeTitle,
        episodeNumber: formData.episodeNumber ? Number(formData.episodeNumber) : null,
        rating: Number(formData.rating),
        reviewTitle: formData.reviewTitle,
        reviewText: formData.reviewText,
      });

      setIsWriteModalOpen(false);
      await fetchReviews();
    } catch (err) {
      setFormError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Write Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
              Episode Reviews & Community Ratings
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
              MongoDB Powered
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Read breakdown reviews of the latest aired episodes or share your own thoughts.
          </p>
        </div>

        <button
          onClick={handleOpenWrite}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Write Episode Review</span>
        </button>
      </div>

      {/* Reviews Feed */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center rounded-2xl liquid-glass-card border border-white/10 text-slate-400">
          <MessageSquare className="w-10 h-10 mx-auto text-slate-500 mb-2" />
          <p className="text-sm font-semibold text-white">No reviews yet!</p>
          <p className="text-xs text-slate-500 mt-1">Be the first to review an airing anime episode.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const hasLiked = user && rev.likedBy?.includes(user.id);
            return (
              <div
                key={rev._id || rev.id}
                className="p-5 rounded-2xl liquid-glass-card border border-white/10 hover:border-purple-500/30 transition-all space-y-3"
              >
                {/* Review Header: User & Rating */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={rev.userAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                      alt={rev.userName}
                      className="w-9 h-9 rounded-xl object-cover ring-1 ring-purple-400/30"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{rev.userName}</span>
                        {rev.episodeNumber ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                            Episode {rev.episodeNumber} Review
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                            Series Review
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-purple-400 font-semibold mt-0.5">
                        {rev.animeTitle}
                      </p>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                    <Star className="w-3.5 h-3.5 fill-amber-300" />
                    <span>{rev.rating} / 10</span>
                  </div>
                </div>

                {/* Review Title & Body */}
                {rev.reviewTitle && (
                  <h4 className="text-sm font-bold font-heading text-slate-100">
                    "{rev.reviewTitle}"
                  </h4>
                )}

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {rev.reviewText}
                </p>

                {/* Footer: Date & Like Reaction */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[11px] font-mono">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  <button
                    onClick={() => handleLike(rev._id || rev.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                      hasLiked
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                    <span>{rev.likes || 0}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Write Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg liquid-glass-nav bg-[#0e1329]/95 rounded-3xl p-6 shadow-2xl border border-white/20">
            <button
              onClick={() => setIsWriteModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold font-heading text-white mb-1">
              Write an Episode Review
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Your review will be stored in MongoDB and visible to anime watchers.
            </p>

            {formError && (
              <div className="mb-3 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Anime Title</label>
                <input
                  type="text"
                  value={formData.animeTitle}
                  onChange={(e) => setFormData({ ...formData, animeTitle: e.target.value })}
                  placeholder="e.g. Frieren: Beyond Journey's End"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Episode Number (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 14"
                    value={formData.episodeNumber}
                    onChange={(e) => setFormData({ ...formData, episodeNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Score (1 to 10)
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-amber-300 focus:outline-none focus:border-purple-500 font-bold"
                  >
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r} className="bg-[#0e1329] text-white">
                        {r} / 10 ★
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Headline / Review Summary
                </label>
                <input
                  type="text"
                  placeholder="e.g. Best battle sequence of the season!"
                  value={formData.reviewTitle}
                  onChange={(e) => setFormData({ ...formData, reviewTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Detailed Review
                </label>
                <textarea
                  rows={4}
                  placeholder="Share your breakdown of the animation, plot progression, OST, voice acting, and standout moments..."
                  value={formData.reviewText}
                  onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                  className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30"
                >
                  {submitting ? 'Posting to MongoDB...' : 'Post Episode Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
