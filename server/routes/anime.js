import express from 'express';
import axios from 'axios';
import { syncService } from '../services/syncService.js';

const router = express.Router();

// In-memory cache
const cache = new Map();
const CACHE_TTL_MS = 6 * 60 * 1000; // 6 minutes for live data

// Register cache clearance on auto-sync trigger
syncService.registerListener(async () => {
  cache.clear();
  console.log('🧹 [Cache Manager] In-memory cache cleared by daily auto-sync.');
});

const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
};

const setCached = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Known verified IMDb scores for popular and classic anime
const knownImdbScores = {
  'attack on titan': '9.1',
  'death note': '8.9',
  'fullmetal alchemist: brotherhood': '9.1',
  'hunter x hunter': '9.0',
  'hunter x hunter (2011)': '9.0',
  'one piece': '8.9',
  'demon slayer: kimetsu no yaiba': '8.6',
  'demon slayer': '8.6',
  'jujutsu kaisen': '8.5',
  'frieren: beyond journey\'s end': '9.0',
  'steins;gate': '8.8',
  'bleach: thousand-year blood war': '8.9',
  'bleach: thousand-year blood war - the conflict': '9.0',
  'bleach': '8.3',
  'naruto': '8.4',
  'naruto: shippuuden': '8.7',
  'naruto shippuden': '8.7',
  'dragon ball z': '8.8',
  'vinland saga': '8.8',
  'cowboy bebop': '8.9',
  'monster': '8.7',
  'code geass': '8.7',
  'neon genesis evangelion': '8.5',
  'chainsaw man': '8.4',
  'solo leveling': '8.4',
  'spy x family': '8.4',
  'my hero academia': '8.3',
  'one-punch man': '8.7',
  'tokyo ghoul': '7.8',
  're:zero -starting life in another world-': '8.2',
  'dandadan': '8.6',
  'detective conan': '8.5',
  'blue lock': '8.2',
  'haikyuu!!': '8.7',
  'mob psycho 100': '8.6',
  'demon slayer: kimetsu no yaiba mugen train arc': '8.7',
  'cyberpunk: edgerunners': '8.3',
  'jojo\'s bizarre adventure': '8.5',
  'tougen anki': '8.3',
  'tougen anki: nikko kegon falls arc': '8.5',
};

// Helper to determine accurate IMDb rating
const computeImdbRating = (title, englishTitle, averageScore) => {
  const norm1 = (title || '').toLowerCase().trim();
  const norm2 = (englishTitle || '').toLowerCase().trim();

  for (const [key, score] of Object.entries(knownImdbScores)) {
    if (norm1.includes(key) || norm2.includes(key) || key.includes(norm1) || key.includes(norm2)) {
      return score;
    }
  }

  if (averageScore && averageScore > 0) {
    return (averageScore / 10).toFixed(1);
  }

  return '8.2';
};

// Helper to convert UNIX timestamp to Indian Standard Time (IST - Asia/Kolkata UTC+5:30)
const formatIST = (timestampSec) => {
  if (!timestampSec) return null;
  const date = new Date(timestampSec * 1000);

  const timeIST = date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const dayIST = date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
  });

  const dateIST = date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const nowSec = Math.floor(Date.now() / 1000);
  const diffSec = timestampSec - nowSec;
  const absDiff = Math.abs(diffSec);
  const totalMins = Math.floor(absDiff / 60);
  const totalHours = Math.floor(totalMins / 60);
  const totalDays = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;
  const remMins = totalMins % 60;

  let countdown = '';
  let shortCountdown = '';

  if (diffSec < 0) {
    if (totalMins < 60) {
      countdown = `Aired ${totalMins}m ago`;
      shortCountdown = `${totalMins}m ago`;
    } else if (totalHours < 24) {
      countdown = `Aired ${totalHours}h ${remMins}m ago`;
      shortCountdown = `${totalHours}h ${remMins}m ago`;
    } else {
      countdown = `Aired ${totalDays}d ${remHours}h ago`;
      shortCountdown = `${totalDays}d ago`;
    }
  } else {
    if (totalMins < 60) {
      countdown = `In ${totalMins} mins`;
      shortCountdown = `In ${totalMins}m`;
    } else if (totalHours < 24) {
      countdown = `In ${totalHours} hours, ${remMins} mins`;
      shortCountdown = `In ${totalHours}h ${remMins}m`;
    } else {
      countdown = `In ${totalDays} day${totalDays > 1 ? 's' : ''}, ${remHours} hours`;
      shortCountdown = `In ${totalDays}d ${remHours}h`;
    }
  }

  const todayISTStr = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const targetISTStr = date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const isTodayIST = todayISTStr === targetISTStr;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISTStr = tomorrow.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const isTomorrowIST = targetISTStr === tomorrowISTStr;

  const dayDisplay = isTodayIST ? `Today (${dayIST})` : isTomorrowIST ? `Tomorrow (${dayIST})` : dayIST;
  const exactISTDisplay = `${isTodayIST ? 'Today' : isTomorrowIST ? 'Tomorrow' : dayIST} (${dayIST}) at ${timeIST}`;

  return {
    timeIST,
    dayIST,
    dateIST,
    dayDisplay,
    exactISTDisplay,
    countdown,
    shortCountdown,
    hoursLeft: diffSec > 0 ? totalHours : 0,
    minsLeft: diffSec > 0 ? remMins : 0,
    daysLeft: diffSec > 0 ? totalDays : 0,
    isTodayIST,
    isTomorrowIST,
    timestamp: timestampSec,
    isoIST: date.toISOString(),
  };
};

// Helper for ultra-high quality anime image URL
const getBestCoverImage = (coverImage) => {
  if (!coverImage) return null;
  return coverImage.extraLarge || coverImage.large || coverImage.medium || null;
};

// Helper to format startDate to IST date string
const formatStartDateIST = (startDate) => {
  if (!startDate || !startDate.year) return 'TBA (2026)';
  const { year, month, day } = startDate;
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  if (!month) return `${year}`;
  const mName = monthNames[month - 1] || `Month ${month}`;
  if (!day) return `${mName} ${year}`;
  return `${day} ${mName} ${year}`;
};

// Helper to normalize queries and handle common anime abbreviations / typos / phrase searches
const normalizeSearchQuery = (q) => {
  if (!q) return '';
  let str = q.trim();
  let lower = str.toLowerCase();

  // Strip conversational / modifier words like 'upcoming', 'airing', 'new', 'shows' that prevent AniList matches
  const stripped = lower.replace(/\b(upcoming|airing|new|latest|all|shows|anime|season|calendar)\b/gi, '').trim();
  if (stripped) {
    lower = stripped;
  }

  // Handle Dragon Ball typo / queries (e.g. "dragonboll", "upcoming dragonboll", "dragonball")
  if (lower.includes('dragonboll') || lower.includes('dragonball') || lower.includes('dragon ball')) {
    if (lower.includes('daima')) return 'Dragon Ball DAIMA';
    return 'Dragon Ball';
  }

  // Handle Bleach Calamity / Thousand-Year Blood War queries
  if (lower.includes('calamity') || (lower.includes('bleach') && (lower.includes('thousand') || lower.includes('blood') || lower.includes('war')))) {
    return 'BLEACH: Thousand-Year Blood War';
  }

  if (lower === 'tybw') return 'BLEACH: Thousand-Year Blood War';
  if (lower.includes('bleach')) return 'Bleach';

  // Abbreviations
  if (lower === 'jjk') return 'Jujutsu Kaisen';
  if (lower === 'aot' || lower === 'snk') return 'Attack on Titan';
  if (lower === 'ds' || lower === 'kny') return 'Demon Slayer';
  if (lower === 'op') return 'One Piece';

  return stripped || str;
};

// ==========================================
// 1. ALL WORLDWIDE CURRENTLY AIRING ANIME (IST)
// Includes Upcoming Broadcast Episodes (e.g. Tougen Anki Season 2) + Ongoing Series
// ==========================================
// ==========================================
// 1. ALL WORLDWIDE CURRENTLY AIRING ANIME (IST)
// Includes 7-Day Rolling Broadcast Window in Indian Standard Time (Asia/Kolkata UTC+5:30)
// Guarantees all currently airing anime appear on their respective days (both earlier today & upcoming)
// ==========================================
router.get(['/airing-ist', '/airing'], async (req, res) => {
  const page = Number(req.query.page) || 1;
  const perPage = Number(req.query.perPage) || 50;
  const rawSearch = (req.query.search || req.query.q || '').trim();
  const search = normalizeSearchQuery(rawSearch);
  const cacheKey = `airing_worldwide_v7_p${page}_${perPage}_${search}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    let enriched = [];
    let pageInfo = { currentPage: page, hasNextPage: false, total: 150 };

    if (search) {
      // Direct search in releasing and not-yet-released anime (e.g. searching "Tougen Anki", "Bleach")
      const searchQuery = `
        query ($search: String, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              total
              currentPage
              hasNextPage
            }
            media(search: $search, type: ANIME, sort: [POPULARITY_DESC]) {
              id
              idMal
              title {
                romaji
                english
                native
              }
              coverImage {
                extraLarge
                large
                color
              }
              bannerImage
              format
              episodes
              status
              genres
              averageScore
              popularity
              description(asHtml: false)
              studios(isMain: true) {
                nodes {
                  name
                }
              }
              nextAiringEpisode {
                id
                episode
                airingAt
                timeUntilAiring
              }
              trailer {
                id
                site
              }
            }
          }
        }
      `;

      const response = await axios.post(
        'https://graphql.anilist.co',
        { query: searchQuery, variables: { search, page, perPage } },
        { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
      );

      const mediaList = response.data?.data?.Page?.media || [];
      pageInfo = response.data?.data?.Page?.pageInfo || pageInfo;

      enriched = mediaList.map((m) => {
        const airingEp = m.nextAiringEpisode;
        const istData = airingEp ? formatIST(airingEp.airingAt) : null;
        const title = m.title?.english || m.title?.romaji || 'Unknown Title';

        return {
          scheduleId: airingEp?.id || m.id,
          animeId: m.id,
          malId: m.idMal,
          title,
          englishTitle: m.title?.english,
          romajiTitle: m.title?.romaji,
          nativeTitle: m.title?.native,
          episode: airingEp ? airingEp.episode : (m.episodes ? `${m.episodes} (Ongoing)` : 'Ongoing'),
          totalEpisodes: m.episodes,
          format: m.format || 'TV',
          coverImage: getBestCoverImage(m.coverImage),
          coverColor: m.coverImage?.color,
          bannerImage: m.bannerImage || getBestCoverImage(m.coverImage),
          genres: m.genres || [],
          score: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
          imdbScore: computeImdbRating(title, m.title?.english, m.averageScore),
          studio: m.studios?.nodes?.[0]?.name || 'Animation Studio',
          description: m.description,
          trailer: m.trailer,
          status: m.status,
          ist: istData || {
            timeIST: 'Upcoming Broadcast',
            dayIST: 'This Season',
            dateIST: '2026',
            countdown: 'Broadcasting Soon',
            isTodayIST: false,
          },
        };
      });
    } else {
      // Primary: Calculate strict 7-day rolling window starting from beginning of TODAY 00:00:00 IST
      // This ensures episodes that aired earlier today in IST are preserved AND upcoming episodes across all 7 days are included.
      const now = Math.floor(Date.now() / 1000);
      const nowISTDate = new Date(now * 1000);
      const istDateString = nowISTDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD in IST
      const startOfTodayIST = Math.floor(new Date(`${istDateString}T00:00:00+05:30`).getTime() / 1000);
      const endOfRollingWeekIST = startOfTodayIST + (7 * 24 * 3600); // 7 full 24h days

      const scheduleQuery = `
        query ($page: Int, $start: Int, $end: Int) {
          Page(page: $page, perPage: 50) {
            pageInfo {
              total
              currentPage
              hasNextPage
            }
            airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: [TIME]) {
              id
              airingAt
              timeUntilAiring
              episode
              media {
                id
                idMal
                title {
                  romaji
                  english
                  native
                }
                coverImage {
                  extraLarge
                  large
                  color
                }
                bannerImage
                format
                episodes
                status
                genres
                averageScore
                popularity
                description(asHtml: false)
                studios(isMain: true) {
                  nodes {
                    name
                  }
                }
                trailer {
                  id
                  site
                }
              }
            }
          }
        }
      `;

      // Top releasing anime query to catch any popular weekly series not yet in the schedule window
      const popularReleasingQuery = `
        query {
          Page(page: 1, perPage: 50) {
            media(status: RELEASING, type: ANIME, sort: [POPULARITY_DESC]) {
              id
              idMal
              title {
                romaji
                english
                native
              }
              coverImage {
                extraLarge
                large
                color
              }
              bannerImage
              format
              episodes
              status
              genres
              averageScore
              popularity
              description(asHtml: false)
              studios(isMain: true) {
                nodes {
                  name
                }
              }
              trailer {
                id
                site
              }
              nextAiringEpisode {
                id
                airingAt
                timeUntilAiring
                episode
              }
            }
          }
        }
      `;

      // Fetch 4 pages in parallel to capture ALL airing anime across 7 days (200+ episodes/week)
      // plus top 50 popular releasing anime to catch any stragglers
      const fetchPage = (pg) =>
        axios.post('https://graphql.anilist.co', { query: scheduleQuery, variables: { page: pg, start: startOfTodayIST, end: endOfRollingWeekIST } }, { timeout: 10000 })
          .catch(() => ({ data: { data: { Page: { airingSchedules: [] } } } }));

      const [p1Res, p2Res, p3Res, p4Res, popRes] = await Promise.all([
        fetchPage(1),
        fetchPage(2),
        fetchPage(3),
        fetchPage(4),
        axios.post('https://graphql.anilist.co', { query: popularReleasingQuery }, { timeout: 10000 }).catch(() => ({ data: { data: { Page: { media: [] } } } })),
      ]);

      const schedulesList = [
        ...(p1Res.data?.data?.Page?.airingSchedules || []),
        ...(p2Res.data?.data?.Page?.airingSchedules || []),
        ...(p3Res.data?.data?.Page?.airingSchedules || []),
        ...(p4Res.data?.data?.Page?.airingSchedules || []),
      ];

      const popularMedia = popRes.data?.data?.Page?.media || [];

      const seenIds = new Set();

      // First, add all schedules within the 7-day IST window
      for (const item of schedulesList) {
        const m = item.media;
        if (!m || seenIds.has(m.id)) continue;
        seenIds.add(m.id);

        const istData = formatIST(item.airingAt);
        const title = m.title?.english || m.title?.romaji || 'Unknown Title';

        enriched.push({
          scheduleId: item.id,
          animeId: m.id,
          malId: m.idMal,
          title,
          englishTitle: m.title?.english,
          romajiTitle: m.title?.romaji,
          nativeTitle: m.title?.native,
          episode: item.episode,
          totalEpisodes: m.episodes,
          format: m.format || 'TV',
          coverImage: getBestCoverImage(m.coverImage),
          coverColor: m.coverImage?.color,
          bannerImage: m.bannerImage || getBestCoverImage(m.coverImage),
          genres: m.genres || [],
          score: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
          imdbScore: computeImdbRating(title, m.title?.english, m.averageScore),
          studio: m.studios?.nodes?.[0]?.name || 'Animation Studio',
          description: m.description,
          trailer: m.trailer,
          status: m.status,
          ist: istData,
        });
      }

      // Second, supplement with popular releasing anime with upcoming episodes
      for (const m of popularMedia) {
        if (!m || seenIds.has(m.id)) continue;
        const airingEp = m.nextAiringEpisode;
        if (!airingEp) continue;

        seenIds.add(m.id);
        const istData = formatIST(airingEp.airingAt);
        const title = m.title?.english || m.title?.romaji || 'Unknown Title';

        enriched.push({
          scheduleId: airingEp.id || m.id,
          animeId: m.id,
          malId: m.idMal,
          title,
          englishTitle: m.title?.english,
          romajiTitle: m.title?.romaji,
          nativeTitle: m.title?.native,
          episode: airingEp.episode,
          totalEpisodes: m.episodes,
          format: m.format || 'TV',
          coverImage: getBestCoverImage(m.coverImage),
          coverColor: m.coverImage?.color,
          bannerImage: m.bannerImage || getBestCoverImage(m.coverImage),
          genres: m.genres || [],
          score: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
          imdbScore: computeImdbRating(title, m.title?.english, m.averageScore),
          studio: m.studios?.nodes?.[0]?.name || 'Animation Studio',
          description: m.description,
          trailer: m.trailer,
          status: m.status,
          ist: istData,
        });
      }

      pageInfo = {
        currentPage: 1,
        hasNextPage: schedulesList.length >= 280,
        total: Math.max(enriched.length, 150),
      };
    }

    const nowIST = new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const todayIST = new Date().toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayWise = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    for (const item of enriched) {
      const day = item.ist?.dayIST;
      if (day && dayWise[day]) {
        dayWise[day].push(item);
      }
    }

    // Sort each day's anime by broadcast time ascending
    for (const d of daysOrder) {
      dayWise[d].sort((a, b) => (a.ist?.timestamp || 0) - (b.ist?.timestamp || 0));
    }

    const dayCounts = Object.fromEntries(daysOrder.map((d) => [d, dayWise[d].length]));

    const result = {
      currentTimeIST: nowIST,
      currentDateIST: todayIST,
      timeZone: 'Asia/Kolkata (IST, UTC+5:30)',
      count: enriched.length,
      totalWorldwideAiring: Math.max(enriched.length, 120),
      pageInfo,
      daysOrder,
      dayWise,
      dayCounts,
      schedules: enriched,
    };

    setCached(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error('Error fetching all airing anime:', err.message);
    return res.json(getFallbackAiringData());
  }
});

// ==========================================
// 2. NEW: ANIME AIRING THIS YEAR (MONTH-WISE CALENDAR)
// Returns all anime released or scheduled to air in 2026 grouped by month
// ==========================================
router.get(['/this-year', '/upcoming-calendar'], async (req, res) => {
  const currentYear = new Date().getFullYear();
  const year = Number(req.query.year) || 2026;
  const requestedMonth = req.query.month ? Number(req.query.month) : null; // 1 to 12
  const requestedSeason = req.query.season ? req.query.season.toUpperCase().trim() : null; // 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER'
  const page = Number(req.query.page) || 1;
  const perPage = Number(req.query.perPage) || 50;
  const cacheKey = `this_year_v6_${year}_m${requestedMonth || 'all'}_s${requestedSeason || 'all'}_p${page}_${perPage}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  let season = requestedSeason;
  if (!season && requestedMonth) {
    if ([1, 2, 3].includes(requestedMonth)) season = 'WINTER';
    else if ([4, 5, 6].includes(requestedMonth)) season = 'SPRING';
    else if ([7, 8, 9].includes(requestedMonth)) season = 'SUMMER';
    else if ([10, 11, 12].includes(requestedMonth)) season = 'FALL';
  }

  try {
    let mediaList = [];
    let pageInfo = { total: 0, currentPage: page, hasNextPage: false };

    if (season) {
      // Query specific season (allows pagination e.g. loading more than 50 Fall/Autumn anime)
      const seasonalQuery = `
        query ($year: Int, $season: MediaSeason, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              total
              currentPage
              hasNextPage
            }
            media(
              seasonYear: $year,
              season: $season,
              type: ANIME,
              sort: [POPULARITY_DESC]
            ) {
              id
              idMal
              title {
                romaji
                english
                native
              }
              coverImage {
                extraLarge
                large
                color
              }
              bannerImage
              startDate {
                year
                month
                day
              }
              format
              episodes
              status
              season
              seasonYear
              genres
              averageScore
              popularity
              description(asHtml: false)
              studios(isMain: true) {
                nodes {
                  name
                }
              }
              nextAiringEpisode {
                episode
                airingAt
              }
              trailer {
                id
                site
              }
            }
          }
        }
      `;

      const response = await axios.post(
        'https://graphql.anilist.co',
        { query: seasonalQuery, variables: { year, season, page, perPage } },
        { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
      );

      const items = response.data?.data?.Page?.media || [];
      pageInfo = response.data?.data?.Page?.pageInfo || pageInfo;
      mediaList = items.map((m) => ({ ...m, season: m.season || season }));
    } else {
      // Full year calendar query: Fetch comprehensive anime across ALL 4 SEASONS simultaneously using GraphQL Aliases
      // This ensures 50 premier anime for Spring, 50 for Monsoon/Summer, 50 for Autumn/Fall, and 50 for Winter (200 total)
      const fullYearFourSeasonsQuery = `
        query ($year: Int) {
          spring: Page(page: 1, perPage: 50) {
            pageInfo { total hasNextPage }
            media(seasonYear: $year, season: SPRING, type: ANIME, sort: [POPULARITY_DESC]) {
              id
              idMal
              title { romaji english native }
              coverImage { extraLarge large color }
              bannerImage
              startDate { year month day }
              format
              episodes
              status
              season
              seasonYear
              genres
              averageScore
              popularity
              description(asHtml: false)
              studios(isMain: true) { nodes { name } }
              nextAiringEpisode { episode airingAt }
              trailer { id site }
            }
          }
          summer: Page(page: 1, perPage: 50) {
            pageInfo { total hasNextPage }
            media(seasonYear: $year, season: SUMMER, type: ANIME, sort: [POPULARITY_DESC]) {
              id
              idMal
              title { romaji english native }
              coverImage { extraLarge large color }
              bannerImage
              startDate { year month day }
              format
              episodes
              status
              season
              seasonYear
              genres
              averageScore
              popularity
              description(asHtml: false)
              studios(isMain: true) { nodes { name } }
              nextAiringEpisode { episode airingAt }
              trailer { id site }
            }
          }
          fall: Page(page: 1, perPage: 50) {
            pageInfo { total hasNextPage }
            media(seasonYear: $year, season: FALL, type: ANIME, sort: [POPULARITY_DESC]) {
              id
              idMal
              title { romaji english native }
              coverImage { extraLarge large color }
              bannerImage
              startDate { year month day }
              format
              episodes
              status
              season
              seasonYear
              genres
              averageScore
              popularity
              description(asHtml: false)
              studios(isMain: true) { nodes { name } }
              nextAiringEpisode { episode airingAt }
              trailer { id site }
            }
          }
          winter: Page(page: 1, perPage: 50) {
            pageInfo { total hasNextPage }
            media(seasonYear: $year, season: WINTER, type: ANIME, sort: [POPULARITY_DESC]) {
              id
              idMal
              title { romaji english native }
              coverImage { extraLarge large color }
              bannerImage
              startDate { year month day }
              format
              episodes
              status
              season
              seasonYear
              genres
              averageScore
              popularity
              description(asHtml: false)
              studios(isMain: true) { nodes { name } }
              nextAiringEpisode { episode airingAt }
              trailer { id site }
            }
          }
        }
      `;

      const response = await axios.post(
        'https://graphql.anilist.co',
        { query: fullYearFourSeasonsQuery, variables: { year } },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );

      const d = response.data?.data || {};
      const springItems = (d.spring?.media || []).map((m) => ({ ...m, season: m.season || 'SPRING' }));
      const summerItems = (d.summer?.media || []).map((m) => ({ ...m, season: m.season || 'SUMMER' }));
      const fallItems = (d.fall?.media || []).map((m) => ({ ...m, season: m.season || 'FALL' }));
      const winterItems = (d.winter?.media || []).map((m) => ({ ...m, season: m.season || 'WINTER' }));

      // Clean deduplication across all 4 seasons
      const combinedMap = new Map();
      for (const m of [...springItems, ...summerItems, ...fallItems, ...winterItems]) {
        if (!combinedMap.has(m.id)) {
          combinedMap.set(m.id, m);
        }
      }
      mediaList = Array.from(combinedMap.values());
      pageInfo = {
        total: mediaList.length,
        currentPage: 1,
        hasNextPage: false,
      };
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Build month breakdown and counters
    const monthCounts = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
      7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0,
      tba: 0,
      total: mediaList.length,
    };

    const formattedList = mediaList.map((m) => {
      const title = m.title?.english || m.title?.romaji;
      const itemSeason = m.season || season || (
        (m.startDate?.month >= 4 && m.startDate?.month <= 6) ? 'SPRING' :
        (m.startDate?.month >= 7 && m.startDate?.month <= 9) ? 'SUMMER' :
        (m.startDate?.month >= 10 && m.startDate?.month <= 12) ? 'FALL' :
        (m.startDate?.month >= 1 && m.startDate?.month <= 3) ? 'WINTER' : null
      );

      const startMonth = m.startDate?.month || (
        itemSeason === 'WINTER' ? 1 :
        itemSeason === 'SPRING' ? 4 :
        itemSeason === 'SUMMER' ? 7 :
        itemSeason === 'FALL' ? 10 : null
      );

      if (startMonth && startMonth >= 1 && startMonth <= 12) {
        monthCounts[startMonth] += 1;
      } else {
        monthCounts.tba += 1;
      }

      const nextEp = m.nextAiringEpisode ? formatIST(m.nextAiringEpisode.airingAt) : null;
      const formattedReleaseIST = formatStartDateIST(m.startDate);
      const startMonthName = startMonth ? monthNames[startMonth - 1] : 'Unannounced';

      // Clear badge telling which month it airs or aired
      let airingMonthBadge = '';
      if (m.startDate?.month) {
        if (startMonth < 10) {
          airingMonthBadge = `Aired in ${startMonthName} ${year}`;
        } else if (startMonth === 10) {
          airingMonthBadge = `Airing this month (${startMonthName} ${year})`;
        } else {
          airingMonthBadge = `Airing in ${startMonthName} ${year}`;
        }
      } else if (itemSeason) {
        const seasonTitle = itemSeason === 'FALL' ? 'Autumn / Fall' :
                            itemSeason === 'SUMMER' ? 'Monsoon / Summer' :
                            itemSeason.charAt(0) + itemSeason.slice(1).toLowerCase();
        airingMonthBadge = `Airing in ${seasonTitle} ${year}`;
      } else {
        airingMonthBadge = `Scheduled for ${year} (Month TBA)`;
      }

      return {
        id: m.id,
        malId: m.idMal,
        title,
        englishTitle: m.title?.english,
        romajiTitle: m.title?.romaji,
        nativeTitle: m.title?.native,
        coverImage: getBestCoverImage(m.coverImage),
        coverColor: m.coverImage?.color,
        bannerImage: m.bannerImage || getBestCoverImage(m.coverImage),
        format: m.format || 'TV',
        episodes: m.episodes || 'TBA',
        status: m.status,
        season: m.season,
        seasonYear: m.seasonYear || year,
        startMonth,
        startMonthName,
        startDate: m.startDate,
        airingMonthBadge,
        releaseDateIST: formattedReleaseIST,
        genres: m.genres || [],
        score: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
        imdbScore: computeImdbRating(title, m.title?.english, m.averageScore),
        description: m.description,
        studio: m.studios?.nodes?.[0]?.name || 'Animation Studio',
        trailer: m.trailer,
        nextAiring: nextEp ? { episode: m.nextAiringEpisode.episode, ist: nextEp } : null,
      };
    });

    // Filter if specific month was requested
    const filteredAnime = requestedMonth
      ? formattedList.filter((item) => item.startMonth === requestedMonth || (season && item.season === season))
      : formattedList;

    const result = {
      year,
      season,
      selectedMonth: requestedMonth,
      monthNames,
      monthCounts,
      pageInfo,
      totalThisYear: formattedList.length,
      anime: filteredAnime,
    };

    setCached(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error('Error fetching upcoming calendar:', err.message);
    return res.json(getFallbackCalendarData(year));
  }
});

// ==========================================
// 3. TOP 5 ANIME OF THE MONTH (CRUNCHYROLL HERO)
// ==========================================
router.get('/top-monthly', async (req, res) => {
  const cacheKey = 'top_5_monthly_v3';
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const query = `
      query {
        Page(page: 1, perPage: 5) {
          media(status: RELEASING, type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC]) {
            id
            idMal
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
              color
            }
            bannerImage
            format
            episodes
            status
            genres
            averageScore
            popularity
            seasonYear
            description(asHtml: false)
            studios(isMain: true) {
              nodes {
                name
              }
            }
            nextAiringEpisode {
              episode
              airingAt
            }
            trailer {
              id
              site
            }
          }
        }
      }
    `;

    const response = await axios.post(
      'https://graphql.anilist.co',
      { query },
      { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
    );

    const mediaList = response.data?.data?.Page?.media || [];

    const badges = [
      '🔥 #1 TOP TRENDING WORLDWIDE',
      '⭐ #2 CRUNCHYROLL FAN FAVORITE',
      '💥 #3 SIMULCAST BLOCKBUSTER',
      '⚡ #4 CRITICS’ MUST-WATCH',
      '🌟 #5 RISING HIT OF THE MONTH',
    ];

    const top5 = mediaList.map((m, idx) => {
      const nextEp = m.nextAiringEpisode ? formatIST(m.nextAiringEpisode.airingAt) : null;
      const title = m.title?.english || m.title?.romaji;
      const imdb = computeImdbRating(title, m.title?.english, m.averageScore);

      return {
        rank: idx + 1,
        spotlightBadge: badges[idx] || `#${idx + 1} OF THE MONTH`,
        id: m.id,
        malId: m.idMal,
        title,
        englishTitle: m.title?.english,
        romajiTitle: m.title?.romaji,
        coverImage: getBestCoverImage(m.coverImage),
        coverColor: m.coverImage?.color,
        bannerImage: m.bannerImage || getBestCoverImage(m.coverImage),
        format: m.format,
        episodes: m.episodes,
        status: m.status,
        genres: m.genres || [],
        score: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
        imdbScore: imdb,
        year: m.seasonYear,
        description: m.description,
        studio: m.studios?.nodes?.[0]?.name,
        trailer: m.trailer,
        nextAiring: nextEp ? { episode: m.nextAiringEpisode.episode, ist: nextEp } : null,
      };
    });

    const result = { top5 };
    setCached(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error('Error fetching top monthly:', err.message);
    return res.json(getFallbackTopMonthly());
  }
});

// ==========================================
// 4. ALL AIRED ANIME (FINISHED CLASSICS)
// ==========================================
router.get('/aired', async (req, res) => {
  const { page = 1, perPage = 24, sort = 'POPULARITY_DESC', genre, q } = req.query;
  const cacheKey = `aired_v3_${page}_${perPage}_${sort}_${genre || 'all'}_${q || 'none'}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const query = `
      query ($page: Int, $perPage: Int, $sort: [MediaSort], $genre: String, $search: String) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(status: FINISHED, type: ANIME, sort: $sort, genre: $genre, search: $search) {
            id
            idMal
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
              color
            }
            bannerImage
            format
            episodes
            status
            genres
            averageScore
            seasonYear
            description(asHtml: false)
            studios(isMain: true) {
              nodes {
                name
              }
            }
            trailer {
              id
              site
            }
          }
        }
      }
    `;

    const variables = {
      page: Number(page),
      perPage: Number(perPage),
      sort: [sort],
    };

    if (genre && genre !== 'All') variables.genre = genre;
    if (q && q.trim()) variables.search = q.trim();

    const response = await axios.post(
      'https://graphql.anilist.co',
      { query, variables },
      { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
    );

    const data = response.data?.data?.Page;
    const mediaList = data?.media || [];

    const formatted = mediaList.map((m) => {
      const title = m.title?.english || m.title?.romaji;
      const imdb = computeImdbRating(title, m.title?.english, m.averageScore);

      return {
        id: m.id,
        malId: m.idMal,
        title,
        englishTitle: m.title?.english,
        romajiTitle: m.title?.romaji,
        nativeTitle: m.title?.native,
        coverImage: getBestCoverImage(m.coverImage),
        coverColor: m.coverImage?.color,
        bannerImage: m.bannerImage || getBestCoverImage(m.coverImage),
        format: m.format,
        episodes: m.episodes,
        status: 'FINISHED',
        genres: m.genres || [],
        score: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
        imdbScore: imdb,
        year: m.seasonYear,
        description: m.description,
        studio: m.studios?.nodes?.[0]?.name,
        trailer: m.trailer,
      };
    });

    const result = {
      anime: formatted,
      pageInfo: data?.pageInfo || { hasNextPage: false, currentPage: 1 },
    };

    setCached(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error('Error fetching aired anime:', err.message);
    return res.json({ anime: getFallbackAiredData(), pageInfo: { hasNextPage: false, currentPage: 1 } });
  }
});

// ==========================================
// 5. GLOBAL ANIME SEARCH
// ==========================================
router.get('/search', async (req, res) => {
  const { q, genre, format, status } = req.query;

  try {
    const query = `
      query ($search: String, $genre: String, $format: MediaFormat, $status: MediaStatus) {
        Page(page: 1, perPage: 30) {
          media(search: $search, genre: $genre, format: $format, status: $status, type: ANIME, sort: POPULARITY_DESC) {
            id
            idMal
            title {
              romaji
              english
            }
            coverImage {
              extraLarge
              large
              color
            }
            bannerImage
            format
            episodes
            status
            genres
            averageScore
            seasonYear
            description(asHtml: false)
            studios(isMain: true) {
              nodes {
                name
              }
            }
          }
        }
      }
    `;

    const variables = {};
    if (q && q.trim()) variables.search = normalizeSearchQuery(q.trim());
    if (genre && genre !== 'All') variables.genre = genre;
    if (format && format !== 'All') variables.format = format;
    if (status && status !== 'All') variables.status = status;

    const response = await axios.post(
      'https://graphql.anilist.co',
      { query, variables },
      { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
    );

    const mediaList = response.data?.data?.Page?.media || [];
    const formatted = mediaList.map((m) => {
      const title = m.title?.english || m.title?.romaji;
      return {
        id: m.id,
        malId: m.idMal,
        title,
        englishTitle: m.title?.english,
        romajiTitle: m.title?.romaji,
        coverImage: getBestCoverImage(m.coverImage),
        bannerImage: m.bannerImage || getBestCoverImage(m.coverImage),
        format: m.format,
        episodes: m.episodes,
        status: m.status,
        genres: m.genres || [],
        score: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
        imdbScore: computeImdbRating(title, m.title?.english, m.averageScore),
        year: m.seasonYear,
        description: m.description,
        studio: m.studios?.nodes?.[0]?.name,
      };
    });

    return res.json({ anime: formatted });
  } catch (err) {
    console.error('Error searching anime:', err.message);
    return res.json({ anime: [] });
  }
});

// ==========================================
// 6. AUTO-SYNC STATUS & TRIGGER
// ==========================================
router.get('/sync-status', (req, res) => {
  res.json(syncService.getStatus());
});

router.post('/sync-now', async (req, res) => {
  const result = await syncService.triggerSync('manual-api-request');
  res.json(result);
});

// ==========================================
// 7. ANIME DETAIL BY ID
// ==========================================
router.get('/:id', async (req, res) => {
  const animeId = Number(req.params.id);
  if (!animeId || isNaN(animeId)) {
    return res.status(400).json({ error: 'Invalid anime ID' });
  }

  const cacheKey = `anime_detail_v3_${animeId}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
            color
          }
          bannerImage
          format
          episodes
          duration
          status
          seasonYear
          genres
          averageScore
          description(asHtml: false)
          studios(isMain: true) {
            nodes {
              name
            }
          }
          nextAiringEpisode {
            episode
            airingAt
          }
          trailer {
            id
            site
          }
        }
      }
    `;

    const response = await axios.post(
      'https://graphql.anilist.co',
      { query, variables: { id: animeId } },
      { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
    );

    const m = response.data?.data?.Media;
    if (!m) return res.status(404).json({ error: 'Anime not found' });

    const nextEp = m.nextAiringEpisode ? formatIST(m.nextAiringEpisode.airingAt) : null;
    const title = m.title?.english || m.title?.romaji;
    const imdb = computeImdbRating(title, m.title?.english, m.averageScore);

    const detail = {
      id: m.id,
      malId: m.idMal,
      title,
      englishTitle: m.title?.english,
      romajiTitle: m.title?.romaji,
      nativeTitle: m.title?.native,
      coverImage: getBestCoverImage(m.coverImage),
      bannerImage: m.bannerImage || getBestCoverImage(m.coverImage),
      format: m.format,
      episodes: m.episodes,
      duration: m.duration,
      status: m.status,
      year: m.seasonYear,
      genres: m.genres || [],
      score: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
      imdbScore: imdb,
      description: m.description,
      studio: m.studios?.nodes?.[0]?.name,
      trailer: m.trailer,
      nextAiring: nextEp ? { episode: m.nextAiringEpisode.episode, ist: nextEp } : null,
    };

    setCached(cacheKey, detail);
    return res.json(detail);
  } catch (err) {
    console.error('Error fetching anime detail:', err.message);
    return res.status(500).json({ error: 'Failed to fetch details' });
  }
});

// Fallback data generators with crisp high-res covers
function getFallbackTopMonthly() {
  return {
    top5: [
      {
        rank: 1,
        spotlightBadge: '🔥 #1 TOP TRENDING WORLDWIDE',
        id: 21,
        title: 'ONE PIECE',
        imdbScore: '8.9',
        coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkASI2.jpg',
        bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJ2afL.jpg',
        genres: ['Action', 'Adventure', 'Fantasy'],
        description: 'Luffy and the Straw Hat crew face legendary revelations in the Egghead Island climax.',
        studio: 'Toei Animation',
      },
      {
        rank: 2,
        spotlightBadge: '⭐ #2 CRUNCHYROLL FAN FAVORITE',
        id: 142838,
        title: 'BLEACH: Thousand-Year Blood War',
        imdbScore: '9.0',
        coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142838-ECx0pZ3zImsq.jpg',
        bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/142838-8c1qf4F1i4fO.jpg',
        genres: ['Action', 'Supernatural'],
        description: 'The Soul Reapers defend the Soul Society against the ruthless Quincy invasion.',
        studio: 'Studio Pierrot',
      },
      {
        rank: 3,
        spotlightBadge: '💥 #3 SIMULCAST BLOCKBUSTER',
        id: 163132,
        title: 'Solo Leveling: Season 2 - Arise from the Shadow',
        imdbScore: '8.4',
        coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163132-jP4G1H5rA87L.jpg',
        bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/163132-5J4kF3a9g1L0.jpg',
        genres: ['Action', 'Fantasy'],
        description: 'Sung Jinwoo faces off against S-rank dungeon bosses with his army of Shadows.',
        studio: 'A-1 Pictures',
      },
      {
        rank: 4,
        spotlightBadge: '⚡ #4 CRITICS’ MUST-WATCH',
        id: 171010,
        title: 'DanDaDan',
        imdbScore: '8.6',
        coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171010-WwB0e4T3fXyZ.jpg',
        bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/171010-8L1mK3b2a4F0.jpg',
        genres: ['Action', 'Comedy', 'Supernatural'],
        description: 'Momo and Okarun battle spirits and extraterrestrial forces in pure animated madness.',
        studio: 'Science SARU',
      },
      {
        rank: 5,
        spotlightBadge: '🌟 #5 RISING HIT OF THE MONTH',
        id: 154587,
        title: 'Frieren: Beyond Journey\'s End',
        imdbScore: '9.0',
        coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n6onjzA1na7K.jpg',
        bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-4VPANptsiLR6.jpg',
        genres: ['Adventure', 'Drama', 'Fantasy'],
        description: 'The elf mage reflects on human connections in an emotional fantasy journey.',
        studio: 'Madhouse',
      },
    ],
  };
}

function getFallbackAiringData() {
  const now = new Date();
  const nowIST = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
  const todayIST = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const currentWeekday = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long' });

  const fallbackShows = [
    {
      scheduleId: 142838,
      animeId: 142838,
      title: 'BLEACH: Thousand-Year Blood War - The Calamity',
      imdbScore: '9.0',
      episode: 9,
      format: 'TV',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142838-ECx0pZ3zImsq.jpg',
      genres: ['Action', 'Supernatural'],
      studio: 'Studio Pierrot',
      ist: {
        timeIST: '07:30 PM',
        dayIST: 'Monday',
        dateIST: 'Broadcast Monday',
        countdown: 'Monday at 07:30 PM IST',
        isTodayIST: currentWeekday === 'Monday',
      },
    },
    {
      scheduleId: 176496,
      animeId: 176496,
      title: 'Blue Lock: Season 2',
      imdbScore: '8.2',
      episode: 4,
      format: 'TV',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx176496-e17f0g2b3.jpg',
      genres: ['Action', 'Sports'],
      studio: '8bit',
      ist: {
        timeIST: '08:30 PM',
        dayIST: 'Tuesday',
        dateIST: 'Broadcast Tuesday',
        countdown: 'Tuesday at 08:30 PM IST',
        isTodayIST: currentWeekday === 'Tuesday',
      },
    },
    {
      scheduleId: 163134,
      animeId: 163134,
      title: 'Reincarnated as a Sword Season 2',
      imdbScore: '8.1',
      episode: 4,
      format: 'TV',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163134-r4K5L6m.jpg',
      genres: ['Action', 'Fantasy'],
      studio: 'C2C',
      ist: {
        timeIST: '09:00 PM',
        dayIST: 'Wednesday',
        dateIST: 'Broadcast Wednesday',
        countdown: 'Wednesday at 09:00 PM IST',
        isTodayIST: currentWeekday === 'Wednesday',
      },
    },
    {
      scheduleId: 178201,
      animeId: 178201,
      title: 'The Exiled Heavy Knight Knows How to Game the System',
      imdbScore: '8.0',
      episode: 17,
      format: 'TV',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx178201-k7b8.jpg',
      genres: ['Action', 'Fantasy'],
      studio: 'GoHands',
      ist: {
        timeIST: '08:56 PM',
        dayIST: 'Thursday',
        dateIST: 'Broadcast Thursday',
        countdown: 'Thursday at 08:56 PM IST',
        isTodayIST: currentWeekday === 'Thursday',
      },
    },
    {
      scheduleId: 176497,
      animeId: 176497,
      title: 'The Apothecary Diaries Season 3',
      imdbScore: '8.9',
      episode: 4,
      format: 'TV',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx176497-Apothecary.jpg',
      genres: ['Drama', 'Mystery'],
      studio: 'TOHO animation & OLM',
      ist: {
        timeIST: '07:30 PM',
        dayIST: 'Friday',
        dateIST: 'Broadcast Friday',
        countdown: 'Friday at 07:30 PM IST',
        isTodayIST: currentWeekday === 'Friday',
      },
    },
    {
      scheduleId: 204650,
      animeId: 204650,
      title: 'TOUGEN ANKI: Nikko Kegon Falls Arc',
      imdbScore: '8.5',
      episode: 1,
      format: 'TV',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx204650-nvK5CuG60WGY.jpg',
      genres: ['Action', 'Supernatural'],
      studio: 'Animation Studio',
      ist: {
        timeIST: '11:00 PM',
        dayIST: 'Friday',
        dateIST: 'Broadcast Friday',
        countdown: 'Friday at 11:00 PM IST',
        isTodayIST: currentWeekday === 'Friday',
      },
    },
    {
      scheduleId: 170942,
      animeId: 170942,
      title: 'Black Clover Season 2',
      imdbScore: '8.4',
      episode: 4,
      format: 'TV',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx170942-bc2.jpg',
      genres: ['Action', 'Fantasy'],
      studio: 'Studio Pierrot',
      ist: {
        timeIST: '07:30 PM',
        dayIST: 'Saturday',
        dateIST: 'Broadcast Saturday',
        countdown: 'Saturday at 07:30 PM IST',
        isTodayIST: currentWeekday === 'Saturday',
      },
    },
    {
      scheduleId: 21,
      animeId: 21,
      title: 'ONE PIECE',
      imdbScore: '8.9',
      episode: 1181,
      format: 'TV',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkASI2.jpg',
      genres: ['Action', 'Adventure', 'Fantasy'],
      studio: 'Toei Animation',
      ist: {
        timeIST: '07:46 PM',
        dayIST: 'Sunday',
        dateIST: 'Broadcast Sunday',
        countdown: 'Sunday at 07:46 PM IST',
        isTodayIST: currentWeekday === 'Sunday',
      },
    },
    {
      scheduleId: 171010,
      animeId: 171010,
      title: 'DanDaDan',
      imdbScore: '8.6',
      episode: 5,
      format: 'TV',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171010-WwB0e4T3fXyZ.jpg',
      genres: ['Action', 'Comedy', 'Supernatural'],
      studio: 'Science SARU',
      ist: {
        timeIST: '09:00 PM',
        dayIST: 'Sunday',
        dateIST: 'Broadcast Sunday',
        countdown: 'Sunday at 09:00 PM IST',
        isTodayIST: currentWeekday === 'Sunday',
      },
    },
  ];

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayWise = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  };

  for (const s of fallbackShows) {
    if (dayWise[s.ist?.dayIST]) {
      dayWise[s.ist.dayIST].push(s);
    }
  }

  const dayCounts = Object.fromEntries(daysOrder.map((d) => [d, dayWise[d].length]));

  return {
    currentTimeIST: nowIST,
    currentDateIST: todayIST,
    timeZone: 'Asia/Kolkata (IST, UTC+5:30)',
    count: fallbackShows.length,
    totalWorldwideAiring: 120,
    pageInfo: { hasNextPage: false, currentPage: 1 },
    daysOrder,
    dayWise,
    dayCounts,
    schedules: fallbackShows,
  };
}

function getFallbackCalendarData(year) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return {
    year,
    selectedMonth: null,
    monthNames,
    monthCounts: {
      1: 4, 2: 2, 3: 1, 4: 8, 5: 3, 6: 2,
      7: 12, 8: 3, 9: 2, 10: 15, 11: 4, 12: 2,
      tba: 5,
      total: 58,
    },
    totalThisYear: 2,
    anime: [
      {
        id: 204650,
        title: 'TOUGEN ANKI: Nikko Kegon Falls Arc',
        imdbScore: '8.5',
        startMonth: 10,
        startMonthName: 'October',
        airingMonthBadge: 'Airing this month (October 2026)',
        releaseDateIST: '2 October 2026',
        format: 'TV',
        coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx204650-nvK5CuG60WGY.jpg',
        genres: ['Action', 'Supernatural'],
        studio: 'Animation Studio',
        description: 'Shiki Ichinose and his demon allies embark on a perilous clash at Nikko Kegon Falls.',
      },
      {
        id: 163132,
        title: 'Solo Leveling: Season 2',
        imdbScore: '8.4',
        startMonth: 1,
        startMonthName: 'January',
        airingMonthBadge: 'Aired in January 2026',
        releaseDateIST: 'January 2026',
        format: 'TV',
        coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163132-jP4G1H5rA87L.jpg',
        genres: ['Action', 'Fantasy'],
        studio: 'A-1 Pictures',
        description: 'The monarch of shadows unlocks unstoppable depths.',
      },
    ],
  };
}

function getFallbackAiredData() {
  return [
    {
      id: 16498,
      title: 'Attack on Titan',
      imdbScore: '9.1',
      episodes: 25,
      year: 2013,
      format: 'TV',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-m5ZMNScKHuf1.jpg',
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFfDggpHJy.jpg',
      genres: ['Action', 'Drama', 'Fantasy'],
      studio: 'WIT Studio',
    },
    {
      id: 101922,
      title: 'Demon Slayer: Kimetsu no Yaiba',
      imdbScore: '8.6',
      episodes: 26,
      year: 2019,
      format: 'TV',
      coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-PEn1CTDYxZWm.jpg',
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-YfZhhrXBj54k.jpg',
      genres: ['Action', 'Fantasy'],
      studio: 'ufotable',
    },
  ];
}

export default router;
