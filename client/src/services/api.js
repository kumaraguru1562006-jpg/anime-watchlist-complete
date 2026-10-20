const rawEnvUrl = (import.meta.env.VITE_API_URL || '').trim();

// Normalize BASE_URL so it reliably hits /api regardless of trailing slashes or missing /api suffix
const resolveBaseUrl = () => {
  if (!rawEnvUrl) {
    return '/api';
  }
  // Strip trailing slashes
  let url = rawEnvUrl.replace(/\/+$/, '');
  // If the user provided the backend domain (e.g. https://anicart.onrender.com), append /api
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
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

  let response;
  try {
    response = await fetch(requestUrl, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new Error(`Unable to connect to server at ${requestUrl}. Please check your internet connection or backend server status.`);
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

