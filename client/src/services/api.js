const rawEnvUrl = (import.meta.env.VITE_API_URL || '').trim();

// Verified Live Render Backend Deployment URL
const DEFAULT_PRODUCTION_BACKEND = 'https://anime-watchlist-complete.onrender.com';

// Normalize BASE_URL so it reliably hits /api in both local dev and production
const resolveBaseUrl = () => {
  // If an explicit environment variable is set, use it:
  if (rawEnvUrl && rawEnvUrl !== '/api') {
    let url = rawEnvUrl.replace(/\/+$/, '');
    if (!url.endsWith('/api')) {
      url = `${url}/api`;
    }
    return url;
  }

  // In local Vite development mode, use local proxy /api -> http://localhost:5000
  if (import.meta.env.DEV) {
    return '/api';
  }

  // In production (Vercel deployment), automatically connect directly to the verified Render backend
  return `${DEFAULT_PRODUCTION_BACKEND}/api`;
};

const BASE_URL = resolveBaseUrl();

// Helper for authorized fetch
const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('anisphere_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ensure endpoint always starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const requestUrl = `${BASE_URL}${cleanEndpoint}`;

  // Optimized retry logic for Render free-tier cold starts
  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 2500; // 2.5 seconds between retries
  let response;
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), attempt === 1 ? 12000 : 25000);

      response = await fetch(requestUrl, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      break; // Success — exit retry loop
    } catch (netErr) {
      lastError = netErr;
      console.warn(`[AniCart API] Attempt ${attempt}/${MAX_RETRIES} for ${requestUrl}: ${netErr.message}`);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  if (!response) {
    throw new Error(
      `Server is waking up — please wait a moment and try again. (${lastError?.name === 'AbortError' ? 'Request timed out' : lastError?.message || 'Network error'})`
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || (response.status === 404
      ? `API endpoint not found (404) at ${requestUrl}. Please verify your backend server is running and VITE_API_URL is configured properly.`
      : `Request failed with status ${response.status}`);
    throw new Error(errorMsg);
  }

  return data;
};

export const api = {
  // Health & Server IST Clock
  getHealth: () => authFetch('/health'),

  // Auth
  register: (userData) =>
    authFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  login: (credentials) =>
    authFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  loginGoogle: (credentials) =>
    authFetch('/auth/google', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  loginFirebase: (profileData) =>
    authFetch('/auth/firebase', {
      method: 'POST',
      body: JSON.stringify(profileData),
    }),
  updateProfile: (profileData) =>
    authFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
  getMe: () => authFetch('/auth/me'),

  // Watchlist (To-Watch, Watched, Progress, Ratings)
  getWatchlist: (status = 'all') => authFetch(`/watchlist?status=${status}`),
  getPublicWatchlist: (userId) => authFetch(`/watchlist/public/${encodeURIComponent(userId)}`),
  getWatchlistStats: () => authFetch('/watchlist/stats'),
  addToWatchlist: (animeData) =>
    authFetch('/watchlist', {
      method: 'POST',
      body: JSON.stringify(animeData),
    }),
  updateWatchlistItem: (animeId, updateData) =>
    authFetch(`/watchlist/${animeId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),
  removeFromWatchlist: (animeId) =>
    authFetch(`/watchlist/${animeId}`, {
      method: 'DELETE',
    }),

  // Anime Data: All Worldwide Airing IST, Top 5 Monthly, Upcoming Calendar, All Aired Anime, Search
  getAiringIST: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return authFetch(`/anime/airing-ist?${query}`);
  },
  getTopMonthlyAnime: () => authFetch('/anime/top-monthly'),
  getUpcomingCalendar: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return authFetch(`/anime/upcoming-calendar?${query}`);
  },
  getAiredAnime: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return authFetch(`/anime/aired?${query}`);
  },
  getTrendingAnime: () => authFetch('/anime/trending'),
  searchAnime: (params) => {
    const query = new URLSearchParams(params).toString();
    return authFetch(`/anime/search?${query}`);
  },
  getAnimeDetail: (animeId) => authFetch(`/anime/${animeId}`),

  // Live Anime News & In-App Reader
  getNews: () => authFetch('/news'),
  getTrendingNews: () => authFetch('/news/trending'),
  getNewsArticle: (params) => {
    const query = new URLSearchParams(params).toString();
    return authFetch(`/news/article?${query}`);
  },

  // Automated Daily Sync
  getSyncStatus: () => authFetch('/anime/sync-status'),
  triggerSyncNow: () =>
    authFetch('/anime/sync-now', {
      method: 'POST',
    }),

  getThisYearAnime: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return authFetch(`/anime/this-year?${query}`);
  },

  // AniChat Bot AI All-Rounder & Status
  getChatStatus: () => authFetch('/chat/status'),
  setChatApiKey: (payload) =>
    authFetch('/chat/set-api-key', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  setTavilyApiKey: (payload) =>
    authFetch('/chat/set-tavily-key', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  chatRecommend: (payload) =>
    authFetch('/chat/recommend', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// Pre-warm: Immediately ping the backend when the app loads so the Render
// free-tier server starts waking up before the user does anything.
// This runs once at import time — fire-and-forget, no await needed.
if (!import.meta.env.DEV) {
  fetch(`${DEFAULT_PRODUCTION_BACKEND}/api/health`, { method: 'GET' }).catch(() => {});
}

