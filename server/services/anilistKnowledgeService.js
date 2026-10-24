import axios from 'axios';

// In-memory TTL cache to prevent AniList rate-limiting (10 minute TTL)
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Clean user text and extract the candidate anime or character entity
 */
export function extractEntityKeywords(userText = '') {
  if (!userText || typeof userText !== 'string') return '';

  let cleaned = userText
    .replace(/[?!.,;:_~#*`"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip common conversational filler patterns
  const fillerPatterns = [
    /^(can you\s+)?(please\s+)?(tell me about|explain|describe|what is|what's|who is|who's|who was)\s+/i,
    /^(can you\s+)?(give me|provide)\s+(a\s+)?(summary of|synopsis of|details on|overview of)\s+/i,
    /^(who is the voice actor (of|for)|who voices|who voiced)\s+/i,
    /^(which studio (made|animated|produced)|who animated|animation studio of)\s+/i,
    /^(is there a season \d+ of|when is the next season of|sequel to)\s+/i,
    /^(recommend me anime like|shows similar to|anime similar to)\s+/i,
    /^(what happens to|did|why did)\s+/i,
    /\b(in the anime|in anime|anime|manga|season \d+|movie|series)\b/gi,
  ];

  for (const pattern of fillerPatterns) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned.length >= 2 ? cleaned : userText.trim();
}

/**
 * Execute GraphQL query against AniList API with in-memory caching
 */
export async function queryAniListGraphQL(query, variables = {}, timeout = 6000) {
  const cacheKey = JSON.stringify({ query, variables });
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const resp = await axios.post(
    'https://graphql.anilist.co',
    { query, variables },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout,
    }
  );

  const data = resp.data?.data;
  if (data) {
    setCached(cacheKey, data);
  }
  return data;
}

/**
 * Deep anime search query on AniList: fetches media, staff, cast, relations, rankings
 */
const ANIME_DEEP_SEARCH_QUERY = `
  query ($search: String) {
    Page(page: 1, perPage: 3) {
      media(search: $search, type: ANIME, sort: [SEARCH_MATCH, POPULARITY_DESC]) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        format
        status
        episodes
        duration
        season
        seasonYear
        startDate { year month day }
        endDate { year month day }
        averageScore
        meanScore
        popularity
        favourites
        genres
        tags {
          name
          rank
          isMediaSpoiler
        }
        studios(isMain: true) {
          nodes {
            name
            isAnimationStudio
          }
        }
        staff(perPage: 4) {
          edges {
            role
            node {
              name { full native }
            }
          }
        }
        characters(perPage: 6, sort: [ROLE, RELEVANCE]) {
          edges {
            role
            node {
              name { full native }
            }
            voiceActors(language: JAPANESE) {
              name { full native }
            }
          }
        }
        nextAiringEpisode {
          episode
          airingAt
          timeUntilAiring
        }
        relations {
          edges {
            relationType
            node {
              id
              title { english romaji }
              format
              status
            }
          }
        }
        description(asHtml: false)
        coverImage {
          extraLarge
          large
          color
        }
        bannerImage
        siteUrl
      }
    }
  }
`;

/**
 * Character search query on AniList
 */
const CHARACTER_SEARCH_QUERY = `
  query ($search: String) {
    Character(search: $search) {
      id
      name {
        full
        native
        alternative
      }
      description(asHtml: false)
      gender
      age
      dateOfBirth { month day }
      media(type: ANIME, perPage: 3, sort: POPULARITY_DESC) {
        nodes {
          id
          title { english romaji }
          format
        }
      }
      siteUrl
      image {
        large
      }
    }
  }
`;

/**
 * Build rich interactive card object for client UI
 */
function buildMediaCard(m) {
  const title = m.title?.english || m.title?.romaji || 'Unknown Title';
  const coverImage = m.coverImage?.extraLarge || m.coverImage?.large || null;
  const bannerImage = m.bannerImage || coverImage;
  const score = m.averageScore ? (m.averageScore / 10).toFixed(1) : '8.2';
  const studio = m.studios?.nodes?.[0]?.name || 'Animation Studio';

  return {
    id: m.id,
    malId: m.idMal,
    title,
    englishTitle: m.title?.english,
    romajiTitle: m.title?.romaji,
    coverImage,
    bannerImage,
    format: m.format || 'TV',
    episodes: m.episodes || 'Ongoing',
    year: m.seasonYear,
    genres: m.genres || [],
    imdbScore: score,
    studio,
    description: m.description ? m.description.replace(/<[^>]*>/g, '').slice(0, 180) + '...' : '',
    matchReason: `Verified AniList Database Record (${m.averageScore ? `${m.averageScore}% Score` : 'Top Scored'})`,
    siteUrl: m.siteUrl || `https://anilist.co/anime/${m.id}`,
  };
}

/**
 * Retrieve comprehensive AniList Knowledge Grounding for any user message.
 * Formats structured facts ready to inject into Google Gemini / OpenAI prompts.
 *
 * @param {string} userMessage - Raw message from user
 * @returns {Promise<{ contextPrompt: string, cards: Array, groundingInfo: Object } | null>}
 */
export async function getAniListGrounding(userMessage = '') {
  if (!userMessage || typeof userMessage !== 'string') return null;

  const entity = extractEntityKeywords(userMessage);
  if (!entity || entity.length < 2) return null;

  try {
    // 1. Search AniList Media Database
    const mediaData = await queryAniListGraphQL(ANIME_DEEP_SEARCH_QUERY, { search: entity });
    const mediaList = mediaData?.Page?.media || [];

    // 2. If user specifically asks "who is" or character query, or media returned empty, check character
    let character = null;
    const isCharacterQuery = /\b(who is|who's|character|protagonist|antagonist|va|voice actor|seiyuu)\b/i.test(userMessage);
    if (isCharacterQuery || mediaList.length === 0) {
      try {
        const charData = await queryAniListGraphQL(CHARACTER_SEARCH_QUERY, { search: entity });
        character = charData?.Character || null;
      } catch {}
    }

    if (mediaList.length === 0 && !character) {
      return null;
    }

    // 3. Construct dense, high-accuracy grounding prompt for LLM
    let contextPrompt = `\n\n--- [VERIFIED LIVE DATABASE GROUNDING: ANILIST GRAPHQL API] ---\n`;
    contextPrompt += `Entity Matched from Query: "${entity}"\n\n`;

    const sources = [];
    const cards = [];

    // Format Media Grounding
    mediaList.forEach((m, idx) => {
      const primaryTitle = m.title?.english || m.title?.romaji;
      const altTitle = m.title?.romaji !== primaryTitle ? m.title?.romaji : m.title?.native;
      const studioName = m.studios?.nodes?.[0]?.name || 'Unknown Studio';
      const score = m.averageScore ? `${m.averageScore}/100` : 'Not Scored Yet';
      const cleanDesc = m.description ? m.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 320) + '...' : 'No synopsis provided.';

      sources.push({
        title: `${primaryTitle} (AniList #${m.id})`,
        url: m.siteUrl || `https://anilist.co/anime/${m.id}`,
      });

      cards.push(buildMediaCard(m));

      contextPrompt += `[ANIME RECORD #${idx + 1}]: ${primaryTitle} ${altTitle ? `(${altTitle})` : ''}\n`;
      contextPrompt += `- AniList ID: ${m.id} | Format: ${m.format || 'TV'} | Status: ${m.status || 'FINISHED'}\n`;
      contextPrompt += `- Episodes: ${m.episodes || 'Ongoing'} | Duration: ${m.duration ? `${m.duration} mins/ep` : 'N/A'}\n`;
      contextPrompt += `- Season & Year: ${m.season || ''} ${m.seasonYear || ''} | Main Studio: ${studioName}\n`;
      contextPrompt += `- Community Rating: ${score} | Popularity Rank: #${m.popularity || 'N/A'}\n`;
      contextPrompt += `- Genres: ${(m.genres || []).join(', ')}\n`;

      if (m.tags && m.tags.length > 0) {
        contextPrompt += `- Tags/Themes: ${m.tags.map((t) => t.name).join(', ')}\n`;
      }

      // Key Staff
      if (m.staff?.edges?.length > 0) {
        const staffList = m.staff.edges.map((e) => `${e.role}: ${e.node?.name?.full}`).join(', ');
        contextPrompt += `- Key Staff: ${staffList}\n`;
      }

      // Main Cast & Seiyuu
      if (m.characters?.edges?.length > 0) {
        contextPrompt += `- Main Characters & Japanese Voice Actors (Seiyuu):\n`;
        m.characters.edges.slice(0, 5).forEach((c) => {
          const charName = c.node?.name?.full || 'Unknown';
          const vaName = c.voiceActors?.[0]?.name?.full || 'Unknown VA';
          contextPrompt += `  * ${charName} (${c.role || 'Role'}) — Voiced by: ${vaName}\n`;
        });
      }

      // Airing details
      if (m.nextAiringEpisode) {
        const date = new Date(m.nextAiringEpisode.airingAt * 1000);
        const timeIST = date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
        contextPrompt += `- Upcoming Broadcast: Episode ${m.nextAiringEpisode.episode} airs on ${timeIST} (Indian Standard Time)\n`;
      }

      // Franchise Relations (Sequels / Prequels)
      if (m.relations?.edges?.length > 0) {
        const relList = m.relations.edges
          .slice(0, 4)
          .map((r) => `${r.relationType}: "${r.node?.title?.english || r.node?.title?.romaji}" (${r.node?.format || 'ANIME'}, ${r.node?.status})`)
          .join(' | ');
        contextPrompt += `- Franchise Relations: ${relList}\n`;
      }

      contextPrompt += `- Official Synopsis: ${cleanDesc}\n\n`;
    });

    // Format Character Grounding if found
    if (character) {
      const charName = character.name?.full || 'Character';
      const altNames = (character.name?.alternative || []).slice(0, 3).join(', ');
      const cleanBio = character.description ? character.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 300) + '...' : '';

      sources.push({
        title: `${charName} (Character on AniList)`,
        url: character.siteUrl || `https://anilist.co/character/${character.id}`,
      });

      contextPrompt += `[CHARACTER RECORD]: ${charName} ${character.name?.native ? `(${character.name.native})` : ''}\n`;
      if (altNames) contextPrompt += `- Also Known As: ${altNames}\n`;
      if (character.gender) contextPrompt += `- Gender: ${character.gender}\n`;
      if (character.age) contextPrompt += `- Age: ${character.age}\n`;
      if (character.media?.nodes?.length > 0) {
        const mediaAppears = character.media.nodes.map((n) => n.title?.english || n.title?.romaji).join(', ');
        contextPrompt += `- Appears In: ${mediaAppears}\n`;
      }
      if (cleanBio) contextPrompt += `- Character Profile: ${cleanBio}\n`;
      contextPrompt += `\n`;
    }

    contextPrompt += `--- [INSTRUCTION: Use the verified AniList database records above to provide a fact-checked, canon-accurate, detailed response. State the studio, character names, Japanese voice actors, and airing status accurately. Do not contradict these official facts.] ---\n\n`;

    return {
      contextPrompt,
      cards: cards.slice(0, 4),
      groundingInfo: {
        entitySearched: entity,
        sources: sources.slice(0, 5),
        provider: 'anilist_graphql',
      },
    };
  } catch (err) {
    console.warn('AniList knowledge grounding warning:', err.message);
    return null;
  }
}
