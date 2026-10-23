import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  firebaseSignIn, 
  firebaseSignUp, 
  firebaseSignInGoogle, 
  firebaseSignOut, 
  onFirebaseAuthStateChanged 
} from '../services/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Synchronous 0ms local hydration: no waiting for sleeping server on boot
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('anisphere_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('anisphere_token') || null);
  
  // Instant load: never block the user on a loading spinner if cached credentials exist
  const [loading, setLoading] = useState(false);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Instantly hydrate watchlist and stats from cache
  const [watchlistMap, setWatchlistMap] = useState(() => {
    try {
      const cached = localStorage.getItem('anisphere_cached_watchlist_map');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  const [stats, setStats] = useState(() => {
    try {
      const cached = localStorage.getItem('anisphere_cached_stats');
      return cached ? JSON.parse(cached) : {
        total: 0,
        planToWatchCount: 0,
        completedCount: 0,
        watchingCount: 0,
        totalEpisodesWatched: 0,
        averageScore: '0.0',
      };
    } catch {
      return {
        total: 0,
        planToWatchCount: 0,
        completedCount: 0,
        watchingCount: 0,
        totalEpisodesWatched: 0,
        averageScore: '0.0',
      };
    }
  });

  // Non-blocking background verification & Stale-While-Revalidate refresh
  useEffect(() => {
    let unsubscribe = () => {};

    const initAuth = () => {
      const savedToken = localStorage.getItem('anisphere_token');
      if (savedToken) {
        // Background re-verification with MongoDB backend (does not freeze UI)
        api.getMe()
          .then((res) => {
            if (res && res.user) {
              setUser(res.user);
              localStorage.setItem('anisphere_user', JSON.stringify(res.user));
              refreshWatchlistAndStats();
            }
          })
          .catch((err) => {
            console.warn('Background token verification:', err.message);
            // Only invalidate if explicitly rejected with 401 Unauthorized
            if (err.message && err.message.includes('401')) {
              localStorage.removeItem('anisphere_token');
              localStorage.removeItem('anisphere_user');
              setUser(null);
            }
          });
      }

      // Refresh watchlist and stats in background
      refreshWatchlistAndStats();

      // Firebase auth listener
      unsubscribe = onFirebaseAuthStateChanged((firebaseUser) => {
        if (firebaseUser) {
          const cleanEmail = firebaseUser.email;
          api.loginFirebase({
            email: cleanEmail,
            name: firebaseUser.displayName || cleanEmail.split('@')[0],
            avatar: firebaseUser.photoURL,
            firebaseUid: firebaseUser.uid,
          })
            .then((res) => {
              localStorage.setItem('anisphere_token', res.token);
              localStorage.setItem('anisphere_user', JSON.stringify(res.user));
              setToken(res.token);
              setUser(res.user);
              refreshWatchlistAndStats();
            })
            .catch((err) => {
              console.error('Error syncing Firebase user to backend:', err);
            });
        }
      });
    };

    initAuth();
    return () => unsubscribe();
  }, []);

  const refreshWatchlistAndStats = async () => {
    try {
      const [s, wl] = await Promise.all([
        api.getWatchlistStats().catch(() => null),
        api.getWatchlist('all').catch(() => null),
      ]);
      
      if (s) {
        setStats(s);
        try {
          localStorage.setItem('anisphere_cached_stats', JSON.stringify(s));
        } catch (e) {}
      }

      if (wl?.items) {
        const map = {};
        wl.items.forEach((item) => {
          map[item.animeId] = item;
        });
        setWatchlistMap(map);
        try {
          localStorage.setItem('anisphere_cached_watchlist_map', JSON.stringify(map));
        } catch (e) {}
      }
    } catch (e) {
      // silent background refresh failure
    }
  };

  /**
   * Login with Email & Password
   * Connects directly to backend API (verified against MongoDB database)
   */
  const loginWithEmail = async (email, password) => {
    try {
      const res = await api.login({ email: email.trim(), password });
      
      localStorage.setItem('anisphere_token', res.token);
      localStorage.setItem('anisphere_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setIsAuthModalOpen(false);

      setTimeout(() => {
        refreshWatchlistAndStats();
      }, 300);

      return res.user;
    } catch (err) {
      console.error('Email login error:', err);
      throw err;
    }
  };

  /**
   * Register with Email & Password
   * Creates verified user account in MongoDB database
   */
  const registerWithEmail = async (email, password, displayName) => {
    try {
      const res = await api.register({
        email: email.trim(),
        password,
        name: displayName?.trim() || email.trim().split('@')[0],
      });

      localStorage.setItem('anisphere_token', res.token);
      localStorage.setItem('anisphere_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setIsAuthModalOpen(false);

      setTimeout(() => {
        refreshWatchlistAndStats();
      }, 300);

      return res.user;
    } catch (err) {
      console.error('Email registration error:', err);
      throw err;
    }
  };

  /**
   * Login with Authentic Google Account (GIS or Google OAuth popup)
   */
  const loginWithGoogle = async (googlePayload) => {
    try {
      let payload = googlePayload;

      // If called with no payload, try Firebase Google popup as fallback
      if (!payload) {
        try {
          const fbData = await firebaseSignInGoogle();
          payload = {
            email: fbData.email,
            name: fbData.displayName,
            avatar: fbData.photoURL,
            googleId: fbData.uid,
          };
        } catch (e) {
          throw new Error('Google Sign-In was cancelled or failed.');
        }
      }

      // Authenticate with backend /api/auth/google
      const res = await api.loginGoogle(payload);

      localStorage.setItem('anisphere_token', res.token);
      localStorage.setItem('anisphere_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setIsAuthModalOpen(false);

      setTimeout(() => {
        refreshWatchlistAndStats();
      }, 300);
      return res.user;
    } catch (err) {
      console.error('Google login error:', err);
      throw err;
    }
  };

  /**
   * Update User Profile (display name, avatar, bio)
   */
  const updateUserProfile = async (updateData) => {
    try {
      const res = await api.updateProfile(updateData);
      setUser(res.user);
      localStorage.setItem('anisphere_user', JSON.stringify(res.user));
      return res.user;
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  const toggleWatchlistStatus = async (anime, targetStatus) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return false;
    }

    try {
      const res = await api.addToWatchlist({
        animeId: anime.id || anime.animeId,
        title: anime.title,
        englishTitle: anime.englishTitle,
        romajiTitle: anime.romajiTitle,
        coverImage: anime.coverImage,
        bannerImage: anime.bannerImage,
        format: anime.format,
        totalEpisodes: anime.episodes || anime.totalEpisodes,
        status: targetStatus,
        genres: anime.genres,
        airingStatus: anime.status,
      });

      const updatedItem = res.item;
      setWatchlistMap((prev) => {
        const next = {
          ...prev,
          [updatedItem.animeId]: updatedItem,
        };
        try {
          localStorage.setItem('anisphere_cached_watchlist_map', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      refreshWatchlistAndStats();
      return true;
    } catch (err) {
      alert(`Could not update watchlist: ${err.message}`);
      return false;
    }
  };

  /**
   * Toggle Pin Ongoing / Favorite Anime
   * Pinned anime are displayed in a separate dedicated showcase and given top priority
   */
  const togglePinAnime = async (anime, explicitPinnedState) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return false;
    }

    const animeId = anime.id || anime.animeId;
    const existing = watchlistMap[animeId];
    const newPinnedState = explicitPinnedState !== undefined 
      ? explicitPinnedState 
      : (existing ? !existing.isPinned : true);

    try {
      let updatedItem;
      if (existing) {
        const res = await api.togglePinWatchlist(animeId, newPinnedState);
        updatedItem = res.item || { ...existing, isPinned: newPinnedState };
      } else {
        // If not in watchlist yet, add it as 'watching' (ongoing) and pinned!
        const res = await api.addToWatchlist({
          animeId,
          title: anime.title,
          englishTitle: anime.englishTitle,
          romajiTitle: anime.romajiTitle,
          coverImage: anime.coverImage,
          bannerImage: anime.bannerImage,
          format: anime.format,
          totalEpisodes: anime.episodes || anime.totalEpisodes,
          status: 'watching',
          genres: anime.genres,
          airingStatus: anime.status || anime.airingStatus,
          isPinned: true,
        });
        updatedItem = res.item;
      }

      setWatchlistMap((prev) => {
        const next = {
          ...prev,
          [animeId]: { ...(prev[animeId] || {}), ...updatedItem, isPinned: newPinnedState },
        };
        try {
          localStorage.setItem('anisphere_cached_watchlist_map', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      refreshWatchlistAndStats();
      return true;
    } catch (err) {
      alert(`Could not update pinned anime: ${err.message}`);
      return false;
    }
  };

  /**
   * Quick +1 / -1 Episode Progress updater
   */
  const updateEpisodeProgress = async (animeId, delta) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return false;
    }

    const existing = watchlistMap[animeId];
    if (!existing) return false;

    const currentEp = existing.episodesWatched || 0;
    const newEp = Math.max(0, currentEp + delta);
    if (existing.totalEpisodes && newEp > existing.totalEpisodes) return false;

    const isCompleted = existing.totalEpisodes && newEp >= existing.totalEpisodes;
    const newStatus = isCompleted ? 'completed' : (existing.status === 'plan_to_watch' ? 'watching' : existing.status);

    try {
      const res = await api.updateWatchlistItem(animeId, {
        episodesWatched: newEp,
        status: newStatus,
      });

      const updatedItem = res.item || { ...existing, episodesWatched: newEp, status: newStatus };
      setWatchlistMap((prev) => {
        const next = {
          ...prev,
          [animeId]: { ...prev[animeId], ...updatedItem },
        };
        try {
          localStorage.setItem('anisphere_cached_watchlist_map', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      refreshWatchlistAndStats();
      return true;
    } catch (err) {
      console.error('Failed to update progress:', err);
      return false;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut();
    } catch (e) {}
    localStorage.removeItem('anisphere_token');
    localStorage.removeItem('anisphere_user');
    localStorage.removeItem('anisphere_cached_watchlist_map');
    localStorage.removeItem('anisphere_cached_stats');
    setToken(null);
    setUser(null);
    setWatchlistMap({});
    setStats({
      total: 0,
      planToWatchCount: 0,
      completedCount: 0,
      watchingCount: 0,
      totalEpisodesWatched: 0,
      averageScore: '0.0',
    });
    setIsProfileModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        stats,
        watchlistMap,
        refreshStats: refreshWatchlistAndStats,
        toggleWatchlistStatus,
        togglePinAnime,
        updateEpisodeProgress,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        updateUserProfile,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        isProfileModalOpen,
        setIsProfileModalOpen,
        openProfileModal: () => setIsProfileModalOpen(true),
        closeProfileModal: () => setIsProfileModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
