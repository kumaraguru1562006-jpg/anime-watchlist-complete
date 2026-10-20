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
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('anisphere_token') || null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [watchlistMap, setWatchlistMap] = useState({}); // { [animeId]: item }
  const [stats, setStats] = useState({
    total: 0,
    planToWatchCount: 0,
    completedCount: 0,
    watchingCount: 0,
    totalEpisodesWatched: 0,
    averageScore: '0.0',
  });

  // Automatically load the website after first time login - no need of login each time!
  useEffect(() => {
    let unsubscribe = () => {};

    const initAuth = async () => {
      // 1. Check if token or user exists in localStorage
      const savedToken = localStorage.getItem('anisphere_token');
      if (savedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          await refreshWatchlistAndStats();
        } catch (err) {
          console.warn('Backend token re-auth failed, trying Firebase state:', err.message);
        }
      } else {
        const savedUser = localStorage.getItem('anisphere_user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {}
        }
      }

      // 2. Attach Google Firebase persistent auth listener
      unsubscribe = onFirebaseAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const cleanEmail = firebaseUser.email;
            const res = await api.loginFirebase({
              email: cleanEmail,
              name: firebaseUser.displayName || cleanEmail.split('@')[0],
              avatar: firebaseUser.photoURL,
              firebaseUid: firebaseUser.uid,
            });
            localStorage.setItem('anisphere_token', res.token);
            localStorage.setItem('anisphere_user', JSON.stringify(res.user));
            setToken(res.token);
            setUser(res.user);
            await refreshWatchlistAndStats();
          } catch (err) {
            console.error('Error syncing Firebase user to backend:', err);
          }
        }
      });

      setLoading(false);
    };

    initAuth();
    return () => unsubscribe();
  }, []);

  const refreshWatchlistAndStats = async () => {
    try {
      const [s, wl] = await Promise.all([
        api.getWatchlistStats(),
        api.getWatchlist('all'),
      ]);
      setStats(s);
      
      const map = {};
      (wl.items || []).forEach((item) => {
        map[item.animeId] = item;
      });
      setWatchlistMap(map);
    } catch (e) {
      // silent
    }
  };

  /**
   * Login with Email via Firebase Auth
   * Automatically persists session across reloads
   */
  const loginWithEmail = async (email, password) => {
    try {
      // 1. Authenticate with Google Firebase Auth
      const fbUser = await firebaseSignIn(email, password);

      // 2. Synchronize user profile with backend database
      const res = await api.loginFirebase({
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email.split('@')[0],
        avatar: fbUser.photoURL,
        firebaseUid: fbUser.uid,
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
      console.error('Firebase Email login error:', err);
      throw err;
    }
  };

  /**
   * Register with Email via Firebase Auth
   */
  const registerWithEmail = async (email, password, displayName) => {
    try {
      // 1. Create account with Google Firebase Auth
      const fbUser = await firebaseSignUp(email, password, displayName);

      // 2. Synchronize user profile with backend database
      const res = await api.loginFirebase({
        email: fbUser.email,
        name: fbUser.displayName || displayName || fbUser.email.split('@')[0],
        avatar: fbUser.photoURL,
        firebaseUid: fbUser.uid,
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
      console.error('Firebase Email registration error:', err);
      throw err;
    }
  };

  /**
   * Login with Google Popup (Firebase or Direct)
   */
  const loginWithGoogle = async (profileData) => {
    try {
      let data = profileData;
      if (!data) {
        data = await firebaseSignInGoogle();
      }

      const res = await api.loginFirebase({
        email: data.email,
        name: data.displayName || data.name,
        avatar: data.photoURL || data.avatar,
        firebaseUid: data.uid || data.googleId,
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
      setWatchlistMap((prev) => ({
        ...prev,
        [updatedItem.animeId]: updatedItem,
      }));

      refreshWatchlistAndStats();
      return true;
    } catch (err) {
      alert(`Could not update watchlist: ${err.message}`);
      return false;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut();
    } catch (e) {}
    localStorage.removeItem('anisphere_token');
    localStorage.removeItem('anisphere_user');
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
