import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const JSONL_OUT_PATH = path.join(DATA_DIR, 'anilist_training_dataset.jsonl');
const ALPACA_OUT_PATH = path.join(DATA_DIR, 'anilist_training_dataset_alpaca.json');

const SYSTEM_INSTRUCTION = `You are AniChat 🍙, the supreme all-rounder anime & pop-culture AI intelligence. You possess canon-accurate, encyclopedic knowledge of Japanese animation, characters, Japanese voice actors (seiyuu), studios, and franchise watch orders. Respond in engaging, structured Markdown with emojis.`;

const ANILIST_PAGE_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        currentPage
      }
      media(type: ANIME, sort: [SCORE_DESC, POPULARITY_DESC]) {
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
        averageScore
        popularity
        favourites
        genres
        tags {
          name
        }
        studios(isMain: true) {
          nodes {
            name
          }
        }
        staff(perPage: 4) {
          edges {
            role
            node {
              name { full }
            }
          }
        }
        characters(perPage: 6, sort: [ROLE, RELEVANCE]) {
          edges {
            role
            node {
              name { full }
            }
            voiceActors(language: JAPANESE) {
              name { full }
            }
          }
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
      }
    }
  }
`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanDescription(desc = '') {
  if (!desc) return '';
  return desc
    .replace(/<[^>]*>/g, '')
    .replace(/\[\/?i\]/gi, '')
    .replace(/\[\/?b\]/gi, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate 4 high-quality instruction-response training pairs for a given anime
 */
function createTrainingPairsForAnime(media) {
  const pairs = [];
  const primaryTitle = media.title?.english || media.title?.romaji;
  const altTitle = media.title?.romaji !== primaryTitle ? media.title?.romaji : media.title?.native;
  const studioName = media.studios?.nodes?.[0]?.name || 'Top Animation Studio';
  const score = media.averageScore ? `${media.averageScore}/100` : 'Highly rated';
  const episodes = media.episodes || 'Ongoing';
  const format = media.format || 'TV';
  const genres = (media.genres || []).join(', ');
  const tags = (media.tags || []).map((t) => t.name).join(', ');
  const synopsis = cleanDescription(media.description);

  if (!primaryTitle || !synopsis) return pairs;

  // 1. General Synopsis & Overview Training Pair
  const overviewPrompt = `Tell me about the anime ${primaryTitle}. What is the plot and format?`;
  let overviewResponse = `### 🍙 ${primaryTitle} ${altTitle ? `*(${altTitle})*` : ''}\n\n`;
  overviewResponse += `**Overview & Information:**\n`;
  overviewResponse += `* **Format:** ${format} (${episodes} Episodes)\n`;
  overviewResponse += `* **Studio:** ${studioName}\n`;
  overviewResponse += `* **Release:** ${media.season || ''} ${media.seasonYear || ''} (${media.status || 'Finished'})\n`;
  overviewResponse += `* **AniList Score:** ${score} (⭐ ${(media.averageScore / 10).toFixed(1)}/10)\n`;
  overviewResponse += `* **Genres:** ${genres}\n`;
  if (tags) overviewResponse += `* **Themes & Tags:** ${tags}\n`;
  overviewResponse += `\n**Synopsis:**\n${synopsis}\n`;

  pairs.push({
    instruction: overviewPrompt,
    response: overviewResponse,
  });

  // 2. Characters & Japanese Voice Actors (Seiyuu) Training Pair
  if (media.characters?.edges?.length > 0) {
    const charPrompt = `Who are the main characters and Japanese voice actors in ${primaryTitle}?`;
    let charResponse = `### 🎭 Main Cast & Voice Actors for ${primaryTitle}\n\n`;
    charResponse += `Here are the key characters and their Japanese seiyuu from ${primaryTitle}:\n\n`;

    media.characters.edges.forEach((c) => {
      const charName = c.node?.name?.full || 'Unknown Character';
      const role = c.role || 'Main';
      const vaName = c.voiceActors?.[0]?.name?.full || 'Not Listed';
      charResponse += `* **${charName}** (${role}): Voiced by **${vaName}**\n`;
    });

    pairs.push({
      instruction: charPrompt,
      response: charResponse,
    });
  }

  // 3. Studio & Key Production Staff Training Pair
  if (media.staff?.edges?.length > 0 || studioName) {
    const staffPrompt = `Which studio animated ${primaryTitle} and who are the key directors or staff?`;
    let staffResponse = `### 🎨 Animation & Production Details for ${primaryTitle}\n\n`;
    staffResponse += `* **Lead Studio:** **${studioName}**\n`;
    if (media.staff?.edges?.length > 0) {
      staffResponse += `* **Notable Production Staff:**\n`;
      media.staff.edges.forEach((e) => {
        staffResponse += `  - **${e.role}:** ${e.node?.name?.full}\n`;
      });
    }
    staffResponse += `\nProduced with top-tier animation and direction showcased on AniList (Rating: ${score}).\n`;

    pairs.push({
      instruction: staffPrompt,
      response: staffResponse,
    });
  }

  // 4. Franchise Relations & Sequels / Prequels Training Pair
  if (media.relations?.edges?.length > 0) {
    const relPrompt = `What are the franchise relations, sequels, or prequels to ${primaryTitle}?`;
    let relResponse = `### 🧭 Franchise Connections for ${primaryTitle}\n\n`;
    relResponse += `According to the official AniList database, ${primaryTitle} is connected to the following works:\n\n`;

    media.relations.edges.forEach((r) => {
      const relType = r.relationType || 'Related';
      const relTitle = r.node?.title?.english || r.node?.title?.romaji || 'Unknown';
      const relFormat = r.node?.format || 'ANIME';
      const relStatus = r.node?.status || 'RELEASED';
      relResponse += `* **${relType}:** "${relTitle}" *(${relFormat}, ${relStatus})*\n`;
    });

    pairs.push({
      instruction: relPrompt,
      response: relResponse,
    });
  }

  return pairs;
}

/**
 * Main Extraction Pipeline
 */
async function runExtraction() {
  const args = process.argv.slice(2);
  const pagesToFetch = parseInt(args.find((a) => a.startsWith('--pages='))?.split('=')[1] || '3', 10);
  const perPage = parseInt(args.find((a) => a.startsWith('--per-page='))?.split('=')[1] || '25', 10);

  console.log(`\n======================================================`);
  console.log(`🍙 AniList Training Dataset Extractor`);
  console.log(`Target: ${pagesToFetch} pages x ${perPage} media (${pagesToFetch * perPage} total anime)`);
  console.log(`======================================================\n`);

  const allPairs = [];
  const jsonlLines = [];
  const alpacaItems = [];

  for (let page = 1; page <= pagesToFetch; page++) {
    console.log(`Fetching AniList Page ${page}/${pagesToFetch}...`);
    try {
      const resp = await axios.post(
        'https://graphql.anilist.co',
        { query: ANILIST_PAGE_QUERY, variables: { page, perPage } },
        {
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          timeout: 10000,
        }
      );

      const mediaList = resp.data?.data?.Page?.media || [];
      console.log(`✓ Received ${mediaList.length} media records from Page ${page}. Processing training pairs...`);

      for (const m of mediaList) {
        const pairs = createTrainingPairsForAnime(m);
        for (const p of pairs) {
          allPairs.push(p);

          // OpenAI / Gemini standard chat format
          const jsonlEntry = {
            messages: [
              { role: 'system', content: SYSTEM_INSTRUCTION },
              { role: 'user', content: p.instruction },
              { role: 'assistant', content: p.response },
            ],
          };
          jsonlLines.push(JSON.stringify(jsonlEntry));

          // Alpaca instruction format
          alpacaItems.push({
            instruction: p.instruction,
            input: '',
            output: p.response,
          });
        }
      }

      // Respect AniList API rate limits (60 requests per minute)
      if (page < pagesToFetch) {
        await sleep(1200);
      }
    } catch (err) {
      console.error(`Error on Page ${page}:`, err.response?.data || err.message);
      break;
    }
  }

  // Write .jsonl format (OpenAI, Gemini AI Studio)
  fs.writeFileSync(JSONL_OUT_PATH, jsonlLines.join('\n') + '\n', 'utf-8');
  console.log(`\n💾 Saved OpenAI / Gemini Chat Dataset: ${JSONL_OUT_PATH}`);
  console.log(`   Lines: ${jsonlLines.length} training examples`);

  // Write Alpaca .json format (Llama / Unsloth / Local fine-tuning)
  fs.writeFileSync(ALPACA_OUT_PATH, JSON.stringify(alpacaItems, null, 2), 'utf-8');
  console.log(`💾 Saved Alpaca Local Fine-Tuning Dataset: ${ALPACA_OUT_PATH}`);
  console.log(`   Examples: ${alpacaItems.length} instruction items`);

  console.log(`\n✅ Dataset extraction complete! Ready for model training.`);
}

runExtraction();
