import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_TAVILY_API_KEY = process.env.TAVILY_API_KEY || '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';
const DEFAULT_TAVILY_MCP_URL = process.env.TAVILY_MCP_URL || 'https://mcp.tavily.com/mcp/?tavilyApiKey=' + DEFAULT_TAVILY_API_KEY;

/**
 * Perform high-speed real-time web search via Tavily Search REST API
 * @param {Object} options
 * @param {string} options.query - Search query
 * @param {number} [options.maxResults=5] - Number of web results
 * @param {string} [options.searchDepth='basic'] - 'basic' or 'advanced'
 * @param {boolean} [options.includeAnswer=true] - Include Tavily's direct AI answer
 * @param {string} [options.apiKey] - Optional override API key
 * @returns {Promise<{ query: string, answer: string, sources: Array<{title: string, url: string, snippet: string}> }>}
 */
export async function searchTavily({
  query,
  maxResults = 5,
  searchDepth = 'basic',
  includeAnswer = true,
  apiKey,
}) {
  const activeKey = apiKey || process.env.TAVILY_API_KEY || DEFAULT_TAVILY_API_KEY;
  if (!activeKey) {
    throw new Error('Tavily API key is not configured.');
  }

  const cleanQuery = query?.trim();
  if (!cleanQuery) return null;

  try {
    const response = await axios.post(
      'https://api.tavily.com/search',
      {
        api_key: activeKey,
        query: cleanQuery,
        search_depth: searchDepth,
        include_answer: includeAnswer,
        max_results: maxResults,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 7000,
      }
    );

    const data = response.data;
    const answer = data.answer || '';
    const rawResults = data.results || [];

    const sources = rawResults.map((r) => ({
      title: r.title || 'Web Citation',
      url: r.url,
      snippet: r.content ? r.content.replace(/\s+/g, ' ').slice(0, 240) + '...' : '',
      score: r.score,
    }));

    return {
      query: cleanQuery,
      answer,
      sources,
      provider: 'tavily_rest',
    };
  } catch (err) {
    console.warn('Tavily REST search failed:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * Execute tool call against Tavily MCP endpoint (JSON-RPC 2.0 over SSE/HTTP)
 * @param {Object} options
 * @param {string} [options.toolName='tavily_search'] - Tool name e.g. tavily_search, tavily_research, tavily_extract
 * @param {Object} [options.arguments] - Tool arguments e.g. { query: '...' }
 * @param {string} [options.mcpUrl] - Optional override MCP endpoint URL
 * @returns {Promise<any>}
 */
export async function callTavilyMcpTool({
  toolName = 'tavily_search',
  args = {},
  mcpUrl,
}) {
  const targetUrl = mcpUrl || process.env.TAVILY_MCP_URL || DEFAULT_TAVILY_MCP_URL;
  if (!targetUrl) {
    throw new Error('Tavily MCP URL is not configured.');
  }

  try {
    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    };

    const response = await axios.post(targetUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 9000,
    });

    const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const dataMatch = responseText.match(/data:\s*(\{[\s\S]*?\})(\r?\n|$)/);

    if (dataMatch) {
      const parsed = JSON.parse(dataMatch[1]);
      if (parsed.result?.content?.[0]?.text) {
        try {
          return JSON.parse(parsed.result.content[0].text);
        } catch {
          return parsed.result.content[0].text;
        }
      }
      return parsed.result;
    }

    if (response.data?.result) {
      return response.data.result;
    }

    return response.data;
  } catch (err) {
    console.warn('Tavily MCP call failed:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * Retrieve high-fidelity real-time web grounding intelligence.
 * Tries high-speed Tavily REST first, falling back to Tavily MCP if necessary.
 * @param {string} query
 * @param {Object} [options]
 * @returns {Promise<{ contextPrompt: string, groundingInfo: Object, answer: string } | null>}
 */
export async function getTavilyGrounding(query, options = {}) {
  const cleanQuery = query?.trim();
  if (!cleanQuery) return null;

  let tavilyData = null;

  // 1. Try high-speed Tavily REST
  try {
    tavilyData = await searchTavily({
      query: cleanQuery,
      maxResults: options.maxResults || 5,
      searchDepth: options.searchDepth || 'basic',
      includeAnswer: true,
      apiKey: options.apiKey,
    });
  } catch {
    // 2. Fallback to Tavily MCP
    try {
      const mcpResult = await callTavilyMcpTool({
        toolName: 'tavily_search',
        args: { query: cleanQuery },
        mcpUrl: options.mcpUrl,
      });

      if (mcpResult && Array.isArray(mcpResult.results)) {
        tavilyData = {
          query: cleanQuery,
          answer: mcpResult.answer || '',
          sources: mcpResult.results.map((r) => ({
            title: r.title || 'Web Citation',
            url: r.url,
            snippet: r.content ? r.content.replace(/\s+/g, ' ').slice(0, 240) + '...' : '',
          })),
          provider: 'tavily_mcp',
        };
      }
    } catch (mcpErr) {
      console.warn('Both Tavily REST and MCP fell through:', mcpErr.message);
    }
  }

  if (!tavilyData || (!tavilyData.answer && (!tavilyData.sources || tavilyData.sources.length === 0))) {
    return null;
  }

  // Format LLM grounding prompt block
  let contextPrompt = `\n\n--- [VERIFIED REAL-TIME WEB GROUNDING VIA TAVILY AI SEARCH (2026/2027)] ---\n`;
  contextPrompt += `User Search Query: "${tavilyData.query}"\n`;
  if (tavilyData.answer) {
    contextPrompt += `Tavily Direct Intelligence Summary: "${tavilyData.answer}"\n`;
  }
  if (tavilyData.sources?.length > 0) {
    contextPrompt += `Verified Web Evidence & Sources:\n`;
    tavilyData.sources.slice(0, 4).forEach((s, i) => {
      contextPrompt += `${i + 1}. [${s.title}] (${s.url})\n   Snippet: ${s.snippet}\n`;
    });
  }
  contextPrompt += `--- [INSTRUCTION: Use the above verified real-time facts to provide a decisive, up-to-date, confident answer. Incorporate exact dates, official releases, and studio statements. Do not guess.] ---\n\n`;

  const groundingInfo = {
    searchQueries: [tavilyData.query],
    sources: (tavilyData.sources || []).map((s) => ({
      title: s.title,
      url: s.url,
    })),
    answer: tavilyData.answer,
    provider: tavilyData.provider || 'tavily',
  };

  return {
    contextPrompt,
    groundingInfo,
    answer: tavilyData.answer,
  };
}
