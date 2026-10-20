import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Plus, 
  Check, 
  Star, 
  Tv, 
  Film, 
  MessageSquare, 
  Flame, 
  Compass, 
  ChevronDown,
  RotateCcw,
  Settings,
  ShieldCheck,
  Zap,
  Swords,
  BookOpen,
  Trash2,
  History,
  Clock,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  ExternalLink,
  Search
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AniChatBot = ({ onOpenDetail }) => {
  const { user, openAuthModal, watchlistMap, toggleWatchlistStatus } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionDone, setActionDone] = useState({});
  const messagesEndRef = useRef(null);

  // Gemini API key state (stored in localStorage and synced with server)
  const [customGeminiKey, setCustomGeminiKey] = useState(() => {
    return localStorage.getItem('anisphere_gemini_api_key') || '';
  });
  const [inputKey, setInputKey] = useState(() => {
    return localStorage.getItem('anisphere_gemini_api_key') || '';
  });
  const [showKeyPassword, setShowKeyPassword] = useState(false);
  const [keySaveLoading, setKeySaveLoading] = useState(false);
  const [keySaveMsg, setKeySaveMsg] = useState(null);

  // Tavily Real-Time Search API & MCP configuration
  const [tavilyApiKey, setTavilyApiKey] = useState(() => {
    return localStorage.getItem('anisphere_tavily_api_key') || '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';
  });
  const [tavilyMcpUrl, setTavilyMcpUrl] = useState(() => {
    return localStorage.getItem('anisphere_tavily_mcp_url') || 'https://mcp.tavily.com/mcp/?tavilyApiKey=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';
  });
  const [inputTavilyKey, setInputTavilyKey] = useState(() => {
    return localStorage.getItem('anisphere_tavily_api_key') || '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';
  });
  const [inputTavilyMcp, setInputTavilyMcp] = useState(() => {
    return localStorage.getItem('anisphere_tavily_mcp_url') || 'https://mcp.tavily.com/mcp/?tavilyApiKey=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';
  });
  const [tavilySaveLoading, setTavilySaveLoading] = useState(false);
  const [tavilySaveMsg, setTavilySaveMsg] = useState(null);
  const [showTavilyPassword, setShowTavilyPassword] = useState(false);

  // Real-Time Search Grounding toggle (default enabled)
  const [searchGroundingEnabled, setSearchGroundingEnabled] = useState(() => {
    const saved = localStorage.getItem('anisphere_search_grounding');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSearchGrounding = () => {
    setSearchGroundingEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('anisphere_search_grounding', String(next));
      return next;
    });
  };

  const DEFAULT_WELCOME_MSG = {
    id: 'welcome',
    sender: 'bot',
    text: `### 🍙 Kon'nichiwa! I am AniChat 🎌

I am your **all-rounder anime intelligence**, rigorously trained across thousands of anime questions, manga lore, battle debates, and release schedules! Ask me anything:
* 🔥 **Upcoming Movies & Arcs:** *"Demon Slayer next movie update"* or *"Chainsaw Man Reze movie"*
* ⚔️ **Character Battles & Power Scaling:** *"Goku vs Saitama"*, *"Gojo vs Sukuna"*, *"Aizen vs Madara"*
* 📖 **Episode Climaxes & Fates:** *"What happened to Gojo in JJK?"*, *"Bleach Calamity breakdown"*
* 🐉 **Dragon Ball & Bleach Lore:** *"What is Dragon Ball DAIMA?"*, *"Ichigo's True Bankai"*
* 🧭 **Definitive Watch Orders:** *"Fate series guide"*, *"Monogatari order"*, *"Bleach filler skip"*
* 🎯 **Custom Recommendations:** *"Dark fantasy like Solo Leveling"* or *"Wholesome romance"*

*(💡 Ask tough questions to test my training, or explore previous chats in **History**!)*`,
    recommendations: [],
    modelUsed: 'AniChat 🍙 All-Rounder Engine 🧠',
  };

  // Saved Conversations / Sessions (stored in localStorage like Gemini)
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('anisphere_chat_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      // Migrate any legacy chat messages into an initial session
      const legacy = localStorage.getItem('anisphere_chat_messages');
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (Array.isArray(parsedLegacy) && parsedLegacy.some((m) => m.sender === 'user')) {
          const firstUser = parsedLegacy.find((m) => m.sender === 'user');
          const title = firstUser ? firstUser.text.slice(0, 36) + (firstUser.text.length > 36 ? '...' : '') : 'Previous Chat';
          return [{
            id: `session_${Date.now()}`,
            title,
            updatedAt: Date.now(),
            messages: parsedLegacy,
          }];
        }
      }
    } catch (e) {
      console.warn('Could not load chat sessions:', e);
    }
    return [];
  });

  // Current active session ID (null = fresh new chat session)
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Active view messages
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MSG]);

  // Save sessions to localStorage whenever sessions state changes
  useEffect(() => {
    try {
      localStorage.setItem('anisphere_chat_sessions', JSON.stringify(sessions));
    } catch (err) {
      console.warn('Could not save chat sessions:', err);
    }
  }, [sessions]);

  // When opening AniChat fresh after having been closed, always present a fresh new chat view
  const handleOpenChat = () => {
    if (!isOpen) {
      // Reopening starts fresh; prior chats remain safe in History
      setActiveSessionId(null);
      setMessages([DEFAULT_WELCOME_MSG]);
      setIsHistoryOpen(false);
      setIsSettingsOpen(false);
    }
    setIsOpen(!isOpen);
  };

  const quickPrompts = [
    { label: '🔥 Demon Slayer next movie update', query: 'What is the latest update on the Demon Slayer next movie?' },
    { label: '📅 Airing today in IST', query: 'What anime are releasing today in Indian Standard Time?' },
    { label: '🍙 What is Dragon Ball DAIMA?', query: 'Explain Dragon Ball DAIMA story and Demon Realm lore' },
    { label: '🗡️ Bleach Calamity breakdown', query: 'What happens in Bleach Thousand-Year Blood War The Calamity?' },
    { label: '⚔️ Gojo vs Sukuna breakdown', query: 'Analyze the battle between Satoru Gojo and Sukuna in JJK' },
    { label: '⚡ Goku vs Saitama: who wins?', query: 'Analyze an in-depth battle between Goku and Saitama: who wins?' },
    { label: '🧭 Fate Series watch order', query: 'What is the definitive chronological watch order for the Fate series?' },
    { label: '🖤 What happened to Eren in AoT?', query: 'What happened to Eren Yeager in Attack on Titan climax?' },
    { label: '👑 Gear 5 Sun God Nika', query: 'Explain Luffy Gear 5 Sun God Nika awakening and powers' },
    { label: '🎨 Ufotable vs MAPPA sakuga', query: 'Compare Ufotable vs MAPPA animation styles and techniques' },
  ];

  const featuredPrompts = [
    {
      icon: '🔥',
      title: 'Demon Slayer Movie',
      desc: 'Infinity Castle trilogy updates',
      query: 'What is the latest update on the Demon Slayer next movie?',
    },
    {
      icon: '📅',
      title: 'Airing Today (IST)',
      desc: 'Indian Standard Time schedule',
      query: 'What anime are releasing today in Indian Standard Time?',
    },
    {
      icon: '🍙',
      title: 'Dragon Ball & Bleach',
      desc: 'DAIMA & Calamity lore',
      query: 'What happens in Bleach Thousand-Year Blood War The Calamity, and what is Dragon Ball DAIMA?',
    },
    {
      icon: '⚔️',
      title: 'Gojo vs Sukuna',
      desc: 'JJK climax & power scaling',
      query: 'Analyze the battle between Satoru Gojo and Sukuna in JJK',
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Helper to format relative time
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  // Helper to generate a clean title/subheading from user query
  const generateSubheading = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('demon slayer') && (lower.includes('movie') || lower.includes('update'))) {
      return '🔥 Demon Slayer Next Movie Update';
    }
    if (lower.includes('bleach') || lower.includes('calamity') || lower.includes('tybw')) {
      return '🗡️ Bleach Calamity Breakdown';
    }
    if (lower.includes('dragon ball') || lower.includes('daima') || lower.includes('dragonboll')) {
      return '🐉 Dragon Ball DAIMA Lore';
    }
    if (lower.includes('goku') && lower.includes('saitama')) {
      return '⚔️ Goku vs Saitama Battle';
    }
    if (lower.includes('gojo') && (lower.includes('sukuna') || lower.includes('die'))) {
      return '⚡ Gojo & JJK Breakdown';
    }
    if (lower.includes('fate') && (lower.includes('watch') || lower.includes('order'))) {
      return '🧭 Fate Series Watch Order';
    }
    if (lower.includes('gear 5') || lower.includes('nika')) {
      return '☀️ Gear 5 Sun God Nika';
    }
    if (lower.includes('today') || lower.includes('airing')) {
      return '📅 Today Airing Schedule (IST)';
    }
    if (lower.includes('eren') || lower.includes('attack on titan')) {
      return '🖤 Attack on Titan Ending';
    }
    if (lower.includes('chainsaw') || lower.includes('makima')) {
      return '🪚 Chainsaw Man Lore';
    }
    // Default clean slice
    const clean = text.replace(/[*_#]/g, '').trim();
    return clean.length > 36 ? clean.slice(0, 36) + '...' : clean;
  };

  // Start a fresh new chat session
  const handleStartNewChat = () => {
    setActiveSessionId(null);
    setMessages([DEFAULT_WELCOME_MSG]);
    setIsHistoryOpen(false);
    setIsSettingsOpen(false);
  };

  // Load a previous session by clicking its subheading
  const handleLoadSession = (session) => {
    setActiveSessionId(session.id);
    setMessages(session.messages || [DEFAULT_WELCOME_MSG]);
    setIsHistoryOpen(false);
    setIsSettingsOpen(false);
  };

  // Delete an individual session
  const handleDeleteSession = (sessionId) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      handleStartNewChat();
    }
  };

  // Sync inputKey when settings open
  useEffect(() => {
    if (isSettingsOpen) {
      setInputKey(customGeminiKey || '');
      setKeySaveMsg(null);
    }
  }, [isSettingsOpen, customGeminiKey]);

  const handleSaveApiKey = async () => {
    const trimmed = inputKey.trim();
    if (!trimmed) return;
    setKeySaveLoading(true);
    setKeySaveMsg(null);

    try {
      const res = await api.setChatApiKey({ apiKey: trimmed });
      if (res && res.success) {
        localStorage.setItem('anisphere_gemini_api_key', trimmed);
        setCustomGeminiKey(trimmed);
        setKeySaveMsg({
          type: 'success',
          text: 'Google Gemini key verified & activated! Real-time 2026 AI is online.',
        });
      } else {
        setKeySaveMsg({
          type: 'error',
          text: res?.error || 'Failed to verify key with Google Gemini API.',
        });
      }
    } catch (err) {
      setKeySaveMsg({
        type: 'error',
        text: err.message || 'Verification failed. Please check the API key.',
      });
    } finally {
      setKeySaveLoading(false);
    }
  };

  const handleResetApiKey = () => {
    localStorage.removeItem('anisphere_gemini_api_key');
    setCustomGeminiKey('');
    setInputKey('');
    setKeySaveMsg({
      type: 'success',
      text: 'Reset to default built-in configuration.',
    });
  };

  const handleSaveTavilyKey = async () => {
    const keyTrimmed = inputTavilyKey.trim();
    const mcpTrimmed = inputTavilyMcp.trim();
    if (!keyTrimmed && !mcpTrimmed) return;

    setTavilySaveLoading(true);
    setTavilySaveMsg(null);

    try {
      const res = await api.setTavilyApiKey({
        apiKey: keyTrimmed,
        mcpUrl: mcpTrimmed,
      });

      if (res && res.success) {
        if (keyTrimmed) {
          localStorage.setItem('anisphere_tavily_api_key', keyTrimmed);
          setTavilyApiKey(keyTrimmed);
        }
        if (mcpTrimmed) {
          localStorage.setItem('anisphere_tavily_mcp_url', mcpTrimmed);
          setTavilyMcpUrl(mcpTrimmed);
        }
        setTavilySaveMsg({
          type: 'success',
          text: 'Tavily Search API & MCP verified! Real-time web intelligence is active.',
        });
      } else {
        setTavilySaveMsg({
          type: 'error',
          text: res?.error || 'Failed to verify Tavily credentials.',
        });
      }
    } catch (err) {
      setTavilySaveMsg({
        type: 'error',
        text: err.message || 'Tavily verification failed.',
      });
    } finally {
      setTavilySaveLoading(false);
    }
  };

  const handleResetTavilyKey = () => {
    localStorage.removeItem('anisphere_tavily_api_key');
    localStorage.removeItem('anisphere_tavily_mcp_url');
    const defaultKey = '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';
    const defaultMcp = 'https://mcp.tavily.com/mcp/?tavilyApiKey=' + defaultKey;
    setTavilyApiKey(defaultKey);
    setInputTavilyKey(defaultKey);
    setTavilyMcpUrl(defaultMcp);
    setInputTavilyMcp(defaultMcp);
    setTavilySaveMsg({
      type: 'success',
      text: 'Reset to official Tavily configuration.',
    });
  };

  // Delete All Chat History (from Settings)
  const handleDeleteAllHistory = () => {
    const confirmed = window.confirm('Are you sure you want to delete all saved conversations? This cannot be undone.');
    if (!confirmed) return;

    setSessions([]);
    try {
      localStorage.removeItem('anisphere_chat_sessions');
      localStorage.removeItem('anisphere_chat_messages');
    } catch {}

    handleStartNewChat();
    setIsSettingsOpen(false);
  };

  const handleSend = async (textToSend = input) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      recommendations: [],
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    // Track or create session
    let sessionId = activeSessionId;
    let sessionTitle = '';

    if (!sessionId) {
      sessionId = `session_${Date.now()}`;
      sessionTitle = generateSubheading(trimmed);
      setActiveSessionId(sessionId);
    }

    try {
      // Build context from current session messages
      const historyContext = nextMessages
        .filter((m) => m.id !== 'welcome')
        .slice(-20)
        .map((m) => ({
          sender: m.sender,
          text: m.text,
        }));

      const data = await api.chatRecommend({
        message: trimmed,
        history: historyContext,
        apiKey: customGeminiKey || undefined,
        grounding: searchGroundingEnabled,
        tavilyApiKey: tavilyApiKey || undefined,
        tavilyMcpUrl: tavilyMcpUrl || undefined,
        provider: 'auto',
      });

      const botMsg = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: data.reply || "Here is what I found for you:",
        recommendations: data.recommendations || [],
        modelUsed: data.modelUsed || 'AniChat 🍙 All-Rounder Engine 🧠',
        grounding: data.grounding || null,
      };

      const finalMessages = [...nextMessages, botMsg];
      setMessages(finalMessages);

      // Save/update session in history
      setSessions((prev) => {
        const existingIdx = prev.findIndex((s) => s.id === sessionId);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            updatedAt: Date.now(),
            messages: finalMessages,
          };
          return updated;
        } else {
          return [
            {
              id: sessionId,
              title: sessionTitle || generateSubheading(trimmed),
              updatedAt: Date.now(),
              messages: finalMessages,
            },
            ...prev,
          ];
        }
      });
    } catch (err) {
      console.error('Chat bot error:', err);
      const errorMsg = {
        id: `bot_err_${Date.now()}`,
        sender: 'bot',
        text: "I encountered a momentary connection hiccup. Feel free to ask about Demon Slayer movie updates, character battles, watch orders, or seasonal releases!",
        recommendations: [],
        modelUsed: 'AniChat 🍙 Engine 🧠',
      };
      const finalMessages = [...nextMessages, errorMsg];
      setMessages(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWatchlist = async (anime, targetStatus) => {
    if (!user) {
      openAuthModal();
      return;
    }

    const payload = {
      animeId: anime.id,
      title: anime.title,
      englishTitle: anime.englishTitle,
      romajiTitle: anime.romajiTitle,
      coverImage: anime.coverImage,
      bannerImage: anime.bannerImage,
      format: anime.format,
      totalEpisodes: anime.episodes,
      imdbScore: anime.imdbScore,
      genres: anime.genres,
      studio: anime.studio,
    };

    const success = await toggleWatchlistStatus(payload, targetStatus);
    if (success) {
      setActionDone((prev) => ({ ...prev, [`${anime.id}_${targetStatus}`]: true }));

      if (targetStatus === 'completed') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f2fe', '#8b5cf6', '#10b981'],
        });
      }

      setTimeout(() => {
        setActionDone((prev) => ({ ...prev, [`${anime.id}_${targetStatus}`]: false }));
      }, 2000);
    }
  };

  const safeWatchlistMap = watchlistMap || {};
  const hasUserMessages = messages.some((m) => m.sender === 'user');

  // Formatter for markdown-like bot text
  const formatBotText = (content = '') => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Header 3
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-bold text-cyan-300 font-heading mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Header 2 or 1
      if (line.startsWith('## ') || line.startsWith('# ')) {
        return (
          <h3 key={idx} className="text-base font-bold text-white font-heading mt-2 mb-1">
            {line.replace(/^#+\s*/, '')}
          </h3>
        );
      }
      // Bold items / bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const itemText = line.trim().replace(/^[\*\-]\s*/, '');
        return (
          <li key={idx} className="text-xs text-slate-200 ml-4 list-disc leading-relaxed my-0.5">
            {formatInlineText(itemText)}
          </li>
        );
      }
      // Numbered list
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <div key={idx} className="text-xs text-slate-200 ml-2 leading-relaxed my-0.5 font-medium">
            {formatInlineText(line)}
          </div>
        );
      }
      // Empty line spacer
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Default paragraph
      return (
        <p key={idx} className="text-xs text-slate-300 leading-relaxed my-0.5">
          {formatInlineText(line)}
        </p>
      );
    });
  };

  const formatInlineText = (text = '') => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="text-purple-300 not-italic font-medium">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1 py-0.5 rounded bg-black/40 text-cyan-300 font-mono text-[10px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Launcher Trigger */}
      <div className="fixed bottom-6 right-6 z-50 select-none">
        <button
          onClick={handleOpenChat}
          className={`relative p-3.5 rounded-2xl flex items-center gap-2.5 transition-all duration-300 shadow-2xl backdrop-blur-xl ${
            isOpen
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white scale-105 shadow-purple-600/40'
              : 'bg-[#0e1329]/90 border border-purple-500/40 text-purple-200 hover:border-purple-400 hover:text-white shadow-xl hover:shadow-purple-500/20'
          }`}
          title="Open AniChat 🍙 Concierge"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-cyan-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#070913]" />
          </div>

          <span className="text-xs font-bold font-heading tracking-wide hidden sm:inline">
            AniChat 🍙
          </span>

          <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 text-[10px] font-mono font-bold">
            All-Rounder ✨
          </span>
        </button>
      </div>

      {/* Main Chat Modal Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[95vw] sm:w-[480px] md:w-[500px] h-[650px] max-h-[86vh] rounded-3xl bg-[#090d1f]/95 border border-purple-500/30 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
          {/* Sleek Minimalist Header */}
          <div className="px-4 py-3 bg-[#0d122b]/85 border-b border-white/10 flex items-center justify-between backdrop-blur-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-md shadow-purple-500/20">
                  <div className="w-full h-full bg-[#0d122b] rounded-[10px] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-cyan-300" />
                  </div>
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0d122b]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold font-heading text-white tracking-wide">AniChat</h3>
                  <span className="text-[10px] text-purple-300 font-mono bg-purple-500/20 px-1.5 py-0.2 rounded border border-purple-500/30">
                    3.5
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>2026 Engine Ready</span>
                </span>
              </div>
            </div>

            {/* Clean Icon Action Buttons */}
            <div className="flex items-center gap-1">
              {/* History Drawer Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsHistoryOpen(!isHistoryOpen);
                  setIsSettingsOpen(false);
                }}
                className={`relative p-2 rounded-xl transition-all ${
                  isHistoryOpen 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={`Chat History (${sessions.length})`}
              >
                <History className="w-4 h-4" />
                {sessions.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#0d122b]" />
                )}
              </button>

              {/* Start Fresh / New Chat Button */}
              <button
                type="button"
                onClick={handleStartNewChat}
                className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-all"
                title="Start Fresh Chat"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Settings Button */}
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(!isSettingsOpen);
                  setIsHistoryOpen(false);
                }}
                className={`p-2 rounded-xl transition-all ${
                  isSettingsOpen 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="Settings & API Key"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-all ml-0.5"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Gemini-Style Previous Conversations History Drawer */}
          {isHistoryOpen && (
            <div className="p-3 bg-[#0a0f26] border-b border-purple-500/30 space-y-2 animate-fade-in text-xs max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Previous Conversations</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {sessions.length} saved
                </span>
              </div>

              {sessions.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-slate-400">
                  No previous conversations yet. Ask AniChat any anime question to begin!
                </div>
              ) : (
                <div className="space-y-1.5 pr-1">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => handleLoadSession(sess)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        activeSessionId === sess.id
                          ? 'bg-purple-600/20 border-purple-500/50 text-white shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate text-white">
                            {sess.title}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5 text-slate-500" />
                            <span>{formatTimeAgo(sess.updatedAt)}</span>
                            <span>•</span>
                            <span>{sess.messages?.filter((m) => m.sender === 'user').length || 0} questions</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(sess.id);
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/5 transition-colors flex-shrink-0"
                        title="Delete this chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Drawer (Gemini API Key Configuration & History Management) */}
          {isSettingsOpen && (
            <div className="p-4 bg-[#0a0f26] border-b border-purple-500/30 space-y-3.5 animate-fade-in text-xs max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AniChat Settings</span>
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  {customGeminiKey ? 'Custom Key Active' : 'Gemini 3.5 Flash Active'}
                </span>
              </div>

              {/* Gemini API Key Configuration Section */}
              <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5 text-xs">
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    <span>Google Gemini API Key</span>
                  </span>
                  <span className="text-[9px] text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">
                    Latest AI
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Enter your latest Google Gemini API key (<code className="text-purple-300">AIzaSy...</code>) to upgrade AniChat with real-time 2026 intelligence, or leave as default to use the active engine.
                </p>

                <div className="relative">
                  <input
                    type={showKeyPassword ? 'text' : 'password'}
                    value={inputKey}
                    onChange={(e) => {
                      setInputKey(e.target.value);
                      if (keySaveMsg) setKeySaveMsg(null);
                    }}
                    placeholder="Enter Gemini API Key (AIzaSy...)"
                    className="w-full bg-[#0d122b] border border-white/10 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyPassword(!showKeyPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showKeyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {keySaveMsg && (
                  <div
                    className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 ${
                      keySaveMsg.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                    }`}
                  >
                    {keySaveMsg.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span>{keySaveMsg.text}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    disabled={keySaveLoading || !inputKey.trim()}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    {keySaveLoading ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Verifying Key...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-amber-300" />
                        <span>Save & Activate Key</span>
                      </>
                    )}
                  </button>

                  {customGeminiKey && (
                    <button
                      type="button"
                      onClick={handleResetApiKey}
                      className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs border border-white/5 transition-all"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Tavily AI Web Search & MCP Grounding Section */}
              <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5 text-xs">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tavily AI Search & MCP Grounding</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleSearchGrounding}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        searchGroundingEnabled ? 'bg-cyan-500' : 'bg-white/20'
                      }`}
                      title={searchGroundingEnabled ? 'Search Grounding Active' : 'Search Grounding Paused'}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          searchGroundingEnabled ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-[9px] text-cyan-300 font-bold font-mono">
                      {searchGroundingEnabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Real-time web search grounding via Tavily AI Search & MCP protocol. Connects AniChat directly to official anime news, release announcements, and live episode broadcasts.
                </p>

                {/* Tavily API Key input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-slate-400 font-medium">Tavily API Key:</label>
                    <span className="text-[9px] text-slate-500 font-mono">tvly-dev-...</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showTavilyPassword ? 'text' : 'password'}
                      value={inputTavilyKey}
                      onChange={(e) => {
                        setInputTavilyKey(e.target.value);
                        if (tavilySaveMsg) setTavilySaveMsg(null);
                      }}
                      placeholder="tvly-dev-..."
                      className="w-full bg-[#0d122b] border border-white/10 focus:border-cyan-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none pr-9 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTavilyPassword(!showTavilyPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showTavilyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Tavily MCP URL input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-slate-400 font-medium">Tavily MCP Server Endpoint:</label>
                    <span className="text-[9px] text-cyan-400 font-mono">mcp.tavily.com</span>
                  </div>
                  <input
                    type="text"
                    value={inputTavilyMcp}
                    onChange={(e) => {
                      setInputTavilyMcp(e.target.value);
                      if (tavilySaveMsg) setTavilySaveMsg(null);
                    }}
                    placeholder="https://mcp.tavily.com/mcp/?tavilyApiKey=..."
                    className="w-full bg-[#0d122b] border border-white/10 focus:border-cyan-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono text-[11px]"
                  />
                </div>

                {tavilySaveMsg && (
                  <div
                    className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 ${
                      tavilySaveMsg.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                    }`}
                  >
                    {tavilySaveMsg.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span>{tavilySaveMsg.text}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveTavilyKey}
                    disabled={tavilySaveLoading || (!inputTavilyKey.trim() && !inputTavilyMcp.trim())}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    {tavilySaveLoading ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Verifying Tavily...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-cyan-300" />
                        <span>Verify & Save Tavily</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetTavilyKey}
                    className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs border border-white/5 transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Chat History Management */}
              <div className="pt-2 flex items-center justify-between border-t border-white/10">
                <span className="text-[11px] text-slate-400 font-mono">
                  {sessions.length} saved conversation{sessions.length !== 1 ? 's' : ''}
                </span>

                <button
                  type="button"
                  onClick={handleDeleteAllHistory}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All Chat History</span>
                </button>
              </div>
            </div>
          )}

          {/* Chat Messages Log or Fresh Empty Hero State */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 pr-2 flex flex-col">
            {!hasUserMessages ? (
              /* Neat Spacious Empty State / Discovery Hero */
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center my-auto animate-fade-in">
                {/* Glowing Anime Bot Emblem */}
                <div className="relative mb-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-purple-500/20 flex items-center justify-center">
                    <div className="w-full h-full bg-[#0d122b] rounded-[14px] flex items-center justify-center">
                      <Bot className="w-7 h-7 text-cyan-300 animate-pulse" />
                    </div>
                  </div>
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-4 ring-[#090d1f]" />
                </div>

                <h3 className="text-base font-bold font-heading text-white tracking-wide flex items-center gap-1.5">
                  <span>AniChat</span>
                  <span className="text-cyan-300 font-sans">🍙</span>
                </h3>

                <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                  Your all-rounder anime intelligence, trained on lore, fight debates, 2026 releases & watch orders.
                </p>

                {/* 4 Clean Featured Prompt Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm mt-5">
                  {featuredPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(p.query)}
                      disabled={loading}
                      className="text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 transition-all duration-200 group flex items-start gap-2 shadow-sm disabled:opacity-50"
                    >
                      <span className="text-sm p-1.5 rounded-lg bg-purple-500/15 border border-purple-500/25 group-hover:scale-110 transition-transform flex-shrink-0">
                        {p.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                          {p.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {p.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Previous Conversations shortcut if saved chats exist */}
                {sessions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5 w-full max-w-sm flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <History className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{sessions.length} saved conversation{sessions.length !== 1 ? 's' : ''}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsHistoryOpen(true)}
                      className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-white font-semibold border border-white/5 transition-all"
                    >
                      Open History
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Active Chat Conversation Log */
              <>
                {messages
                  .filter((m) => m.id !== 'welcome')
                  .map((m) => {
                    const isBot = m.sender === 'bot';

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} animate-fade-in`}
                      >
                        <div
                          className={`max-w-[90%] rounded-2xl p-3.5 shadow-lg border text-xs leading-relaxed ${
                            isBot
                              ? 'bg-[#121833] border-purple-500/20 text-slate-200'
                              : 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400/30 text-white'
                          }`}
                        >
                          {isBot ? formatBotText(m.text) : m.text}
                        </div>

                        {/* Engine Model Badge */}
                        {isBot && m.modelUsed && (
                          <span className="text-[9px] text-slate-500 mt-1 ml-1 flex items-center gap-1 font-mono">
                            <span>{m.modelUsed}</span>
                          </span>
                        )}

                        {/* Google Search Grounding Sources & Web Citations */}
                        {isBot && m.grounding && (m.grounding.sources?.length > 0 || m.grounding.searchQueries?.length > 0) && (
                          <div className="mt-2 w-full max-w-[90%] p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 shadow-sm backdrop-blur-md space-y-1.5 animate-fade-in">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-cyan-300">
                              <Globe className="w-3 h-3 text-cyan-400" />
                              <span>Google Search Grounding Sources:</span>
                            </div>

                            {m.grounding.searchQueries?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {m.grounding.searchQueries.map((q, qIdx) => (
                                  <span key={qIdx} className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-cyan-200">
                                    🔍 {q}
                                  </span>
                                ))}
                              </div>
                            )}

                            {m.grounding.sources?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {m.grounding.sources.map((s, sIdx) => (
                                  <a
                                    key={sIdx}
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                                  >
                                    <span className="truncate max-w-[150px]">{s.title || 'Web Link'}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Visual Recommendation Cards Grid */}
                        {isBot && m.recommendations && m.recommendations.length > 0 && (
                          <div className="mt-3 w-full space-y-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Recommended Series (1-Click Watchlist)</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {m.recommendations.map((anime) => {
                                const currentStatus = safeWatchlistMap[anime.id];

                                return (
                                  <div
                                    key={anime.id}
                                    className="p-2 rounded-2xl bg-black/40 border border-white/10 hover:border-purple-500/40 flex gap-2.5 transition-colors group cursor-pointer"
                                    onClick={() => onOpenDetail && onOpenDetail(anime.id)}
                                  >
                                    <img
                                      src={anime.coverImage || 'https://via.placeholder.com/80x120'}
                                      alt={anime.title}
                                      className="w-14 h-20 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                                    />

                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                      <div>
                                        <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                                          {anime.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                          <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                                            <Star className="w-2.5 h-2.5 fill-current" />
                                            {anime.imdbScore || '8.4'}
                                          </span>
                                          <span>•</span>
                                          <span>{anime.format || 'TV'}</span>
                                          <span>•</span>
                                          <span className="truncate">{anime.studio || 'Studio'}</span>
                                        </div>
                                      </div>

                                      {/* 1-Click Watchlist Action */}
                                      <div
                                        className="flex items-center gap-1.5 mt-1.5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          onClick={() => handleToggleWatchlist(anime, 'watching')}
                                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 ${
                                            currentStatus === 'watching'
                                              ? 'bg-cyan-500 text-black font-bold'
                                              : 'bg-white/10 hover:bg-white/20 text-cyan-300'
                                          }`}
                                        >
                                          {actionDone[`${anime.id}_watching`] ? (
                                            <Check className="w-3 h-3 text-emerald-400" />
                                          ) : (
                                            <Tv className="w-2.5 h-2.5" />
                                          )}
                                          <span>{currentStatus === 'watching' ? 'Watching' : '+ Watch'}</span>
                                        </button>

                                        <button
                                          onClick={() => handleToggleWatchlist(anime, 'plan_to_watch')}
                                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                                            currentStatus === 'plan_to_watch'
                                              ? 'bg-purple-500 text-white font-bold'
                                              : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                                          }`}
                                        >
                                          Plan
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </>
            )}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-purple-300 w-fit animate-pulse">
                <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>AniChat 🍙 is analyzing anime pop culture...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips (Rendered during active conversation for quick follow-ups) */}
          {hasUserMessages && (
            <div className="px-3 py-1.5 bg-[#070913]/90 border-t border-white/5 overflow-x-auto scrollbar-none flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
              <span className="text-slate-500 font-semibold flex-shrink-0 text-[10px]">Prompts:</span>
              {quickPrompts.slice(0, 6).map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p.query)}
                  disabled={loading}
                  className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white whitespace-nowrap flex-shrink-0 transition-colors disabled:opacity-50 text-[10px]"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Single-Row Liquid Glassy Search Bar with Embedded Grounding Toggle */}
          <div className="p-3 liquid-glass-chat-bar">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1 liquid-glass-search-container rounded-2xl flex items-center px-2.5 py-1.5 gap-2">
                {/* Embedded Google Search Grounding Toggle */}
                <button
                  type="button"
                  onClick={toggleSearchGrounding}
                  className={`px-2 py-1 rounded-xl flex items-center gap-1.5 text-[10px] font-semibold transition-all flex-shrink-0 ${
                    searchGroundingEnabled
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:text-slate-300'
                  }`}
                  title={`Google Search Grounding: ${searchGroundingEnabled ? 'ACTIVE (Real-Time Web Search)' : 'OFF'} - Click to toggle`}
                >
                  <Globe className={`w-3.5 h-3.5 ${searchGroundingEnabled ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="hidden sm:inline">
                    {searchGroundingEnabled ? 'Search ON' : 'Search OFF'}
                  </span>
                  {searchGroundingEnabled && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>

                {/* Query Input */}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={searchGroundingEnabled ? "Ask AniChat with live Google Search Grounding..." : "Ask AniChat anything about anime..."}
                  disabled={loading}
                  className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none disabled:opacity-50 font-normal"
                />

                {/* Clear Input Button */}
                {input.trim() && (
                  <button
                    type="button"
                    onClick={() => setInput('')}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                    title="Clear query"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Submit / Send Query Button */}
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="liquid-glass-btn p-2.5 rounded-2xl text-white disabled:opacity-40 disabled:pointer-events-none flex-shrink-0 flex items-center justify-center cursor-pointer shadow-lg"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
