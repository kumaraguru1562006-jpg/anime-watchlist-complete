import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  Table,
  ExternalLink,
  Link2,
  BookOpen,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

/**
 * Safely extracts pure text/markdown from diverse API response structures
 * (Gemini API response objects, Google Search grounding, structured JSON, arrays, null/undefined).
 * Avoids String(object) which causes "[object Object]" leaks.
 */
function extractSafeMarkdownText(content, paragraphs) {
  // 1. If content is already a string
  if (typeof content === 'string') {
    const trimmed = content.trim();
    // If it's a JSON string, try to extract article text
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return extractSafeMarkdownText(parsed, paragraphs);
      } catch {
        return content;
      }
    }
    return content;
  }

  // 2. If content is an array (e.g. paragraphs or parts array)
  if (Array.isArray(content)) {
    return content
      .map((item) => extractSafeMarkdownText(item))
      .filter(Boolean)
      .join('\n\n');
  }

  // 3. If content is an object (Gemini API, Google Search grounding, or API response)
  if (typeof content === 'object' && content !== null) {
    // 3a. Gemini API structure: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
    if (content.candidates && Array.isArray(content.candidates)) {
      const parts = content.candidates[0]?.content?.parts;
      if (Array.isArray(parts)) {
        return parts.map((p) => p.text || '').filter(Boolean).join('\n\n');
      }
    }

    // 3b. Gemini content parts structure: { parts: [{ text: "..." }] }
    if (content.parts && Array.isArray(content.parts)) {
      return content.parts.map((p) => p.text || '').filter(Boolean).join('\n\n');
    }

    // 3c. Google Search Grounding response or direct text field
    if (typeof content.text === 'string') {
      return content.text;
    }
    if (typeof content.text === 'function') {
      try {
        return content.text();
      } catch {
        // continue
      }
    }

    // 3d. Standard structured article fields
    if (content.markdownContent) return extractSafeMarkdownText(content.markdownContent);
    if (content.content) return extractSafeMarkdownText(content.content);
    if (content.article) return extractSafeMarkdownText(content.article);
    if (content.paragraphs) return extractSafeMarkdownText(content.paragraphs);
    if (content.summary) return extractSafeMarkdownText(content.summary);
    if (content.message) return extractSafeMarkdownText(content.message);
  }

  // 4. Fallback to paragraphs array if provided
  if (paragraphs) {
    if (typeof paragraphs === 'string') return paragraphs;
    if (Array.isArray(paragraphs)) {
      return paragraphs
        .map((p) => extractSafeMarkdownText(p))
        .filter(Boolean)
        .join('\n\n');
    }
  }

  return '';
}

export const ArticleContentRenderer = ({
  content = '',
  paragraphs = [],
  tableData = null,
  citations = [],
  fontSizeLevel = 1, // 0: sm, 1: base, 2: lg
  status = 'complete', // 'complete' | 'summary_only' | 'link_only' | 'load_error'
  hasFullContent = true,
  summary = '',
  sourceUrl = '',
  sourceName = 'Anime News Network',
  coverImage = '',
  onRetry = null,
}) => {
  // Safely extract and parse markdown or HTML
  const { sanitizedHtml, renderError, isPureHtml } = useMemo(() => {
    try {
      const rawText = extractSafeMarkdownText(content, paragraphs);
      if (!rawText || !rawText.trim()) {
        return { sanitizedHtml: '', renderError: null, isPureHtml: false };
      }

      // Detect if content is already HTML or Markdown
      const hasHtmlTags = /<(?:p|div|table|h[1-6]|ul|ol|blockquote)[\s>]/i.test(rawText);

      let rawHtml = '';
      if (hasHtmlTags) {
        // If content is already rich HTML, do not re-run through marked
        rawHtml = rawText;
      } else {
        // Parse with marked (GFM tables, breaks, links, lists, headings)
        rawHtml = marked.parse(rawText, {
          gfm: true,
          breaks: true,
        });
      }

      // Enhance HTML: add target="_blank", referrerpolicy, and wrap tables with responsive containers
      const enhancedHtml = rawHtml
        .replace(/<a\s+href="http/gi, '<a target="_blank" rel="noopener noreferrer" href="http')
        .replace(/<img\s+/gi, '<img referrerpolicy="no-referrer" loading="lazy" ')
        .replace(
          /<table/gi,
          '<div class="my-6 overflow-x-auto rounded-2xl border border-white/10 bg-[#070b1c]/90 shadow-xl shadow-purple-950/20"><table class="w-full text-left border-collapse text-xs sm:text-sm"'
        )
        .replace(/<\/table>/gi, '</table></div>');

      // Sanitize with DOMPurify
      const clean = DOMPurify.sanitize(enhancedHtml, {
        ADD_ATTR: ['target', 'rel', 'id', 'referrerpolicy', 'loading'],
      });

      return { sanitizedHtml: clean, renderError: null, isPureHtml: hasHtmlTags };
    } catch (err) {
      console.error('Failed to render article markdown content:', err);
      return { sanitizedHtml: '', renderError: err.message, isPureHtml: false };
    }
  }, [content, paragraphs]);

  // Typography font size classes
  const fontClasses =
    fontSizeLevel === 0
      ? 'text-sm leading-relaxed'
      : fontSizeLevel === 2
      ? 'text-lg leading-loose'
      : 'text-base leading-relaxed';

  // State 1: Content Failed to Load Error View
  if (status === 'load_error' || (!hasFullContent && !summary && !sanitizedHtml)) {
    return (
      <div className="p-8 rounded-3xl bg-[#0e122b] border border-red-500/30 space-y-5 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-lg mx-auto">
          <h3 className="text-lg font-bold text-white font-heading">
            Article Content Unavailable Directly
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The publisher server for <strong className="text-white">{sourceName}</strong> could not
            be reached or has protected access to this story. You can retry loading or read the
            full journalistic article directly on their website.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-5 py-2.5 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 border border-purple-500/40 text-xs font-semibold text-purple-200 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Loading</span>
            </button>
          )}

          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold tracking-wide transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <span>Read Original Article on {sourceName}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // State 2: Summary-Only Coverage View (Source feed provided only headline & summary)
  if (status === 'summary_only' || (!hasFullContent && summary)) {
    return (
      <div className="space-y-8">
        {/* Editorial Summary Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c112e] to-[#080d24] border border-cyan-500/30 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider">
                Official Publisher Summary
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">{sourceName}</span>
          </div>

          <blockquote className="text-base sm:text-lg text-slate-200 font-normal leading-relaxed italic border-l-4 border-cyan-400/80 pl-4 my-2">
            "{summary}"
          </blockquote>

          {/* Honest Publisher Disclaimer */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3 text-xs text-slate-300">
            <BookOpen className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-white">Coverage Details & External Reporting</p>
              <p className="text-slate-400 leading-relaxed">
                This news wire provides a verified headline and executive summary. Complete
                in-depth reporting, full character interviews, and photo galleries are hosted
                directly on the publisher’s website.
              </p>
            </div>
          </div>

          {/* Action CTA */}
          {sourceUrl && (
            <div className="pt-2">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold tracking-wide shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.02]"
              >
                <span>Read Full Original Article on {sourceName}</span>
                <ExternalLink className="w-4 h-4 text-cyan-300" />
              </a>
            </div>
          )}
        </div>

        {/* Structured Tabular Data Component (if available) */}
        {tableData && tableData.headers && tableData.rows && tableData.rows.length > 0 && (
          <div className="rounded-2xl bg-[#080d22] border border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-950/20">
            <div className="px-5 py-3 bg-[#0d1430] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                  Verified Data & Release Index
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead className="bg-purple-950/50 border-b border-white/10">
                  <tr>
                    {tableData.headers.map((h, i) => (
                      <th
                        key={i}
                        className="p-3.5 text-cyan-300 font-bold font-mono tracking-wider uppercase text-xs"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tableData.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-white/[0.03] transition-colors even:bg-white/[0.015]"
                    >
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-3.5 text-slate-300 leading-normal align-middle">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // State 3: Link-Only Coverage View
  if (status === 'link_only' || (!hasFullContent && !sanitizedHtml)) {
    return (
      <div className="p-8 rounded-3xl bg-[#0a0e26] border border-white/10 text-center space-y-4 shadow-xl">
        <FileText className="w-10 h-10 text-cyan-400 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white font-heading">
            Official Publisher Headline Notice
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            This article is published on <strong className="text-white">{sourceName}</strong>.
            Click below to open and read the complete coverage.
          </p>
        </div>
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all"
          >
            <span>Open Article on {sourceName}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    );
  }

  // Handle Render Error Gracefully
  if (renderError) {
    return (
      <div className="p-5 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-2 text-xs text-red-200">
        <div className="flex items-center gap-2 font-bold text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>Content Formatting Notice</span>
        </div>
        <p className="text-slate-300">
          The article text is being rendered in safe fallback mode.
        </p>
        {paragraphs && paragraphs.length > 0 && (
          <div className="space-y-3 pt-2 text-slate-200">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="leading-relaxed">
                {typeof p === 'string' ? p : p?.text || ''}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // State 4: Complete Article Content Rendering View
  return (
    <div className={`article-rendered-content ${fontClasses} space-y-6 text-slate-200`}>
      {/* 1. Main Rendered Markdown or HTML Content with Rich Prose Classes */}
      {sanitizedHtml && (
        <div
          className="prose-content space-y-4
            [&_h1]:text-2xl [&_h1]:sm:text-3xl [&_h1]:font-black [&_h1]:font-heading [&_h1]:text-white [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:tracking-tight [&_h1]:leading-tight
            [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-bold [&_h2]:font-heading [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:pt-4 [&_h2]:border-t [&_h2]:border-white/10 [&_h2]:tracking-tight
            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:font-heading [&_h3]:text-purple-300 [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:tracking-tight
            [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-slate-200
            [&_a]:text-cyan-400 [&_a]:hover:text-cyan-300 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-cyan-500/40 [&_a]:hover:decoration-cyan-400 [&_a]:transition-colors
            [&_table]:w-full [&_table]:border-collapse [&_th]:p-3.5 [&_th]:text-cyan-300 [&_th]:font-bold [&_th]:font-mono [&_th]:text-xs [&_th]:uppercase [&_th]:bg-purple-950/80 [&_th]:border-b [&_th]:border-white/10
            [&_td]:p-3.5 [&_td]:text-slate-300 [&_td]:border-b [&_td]:border-white/5 [&_tbody_tr:hover]:bg-white/[0.04] [&_tbody_tr:nth-child(even)]:bg-white/[0.015]
            [&_blockquote]:my-6 [&_blockquote]:p-4 [&_blockquote]:rounded-2xl [&_blockquote]:bg-purple-950/30 [&_blockquote]:border-l-4 [&_blockquote]:border-purple-400 [&_blockquote]:text-purple-200 [&_blockquote]:italic [&_blockquote]:shadow-inner
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:my-4 [&_ul]:text-slate-300
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5 [&_ol]:my-4 [&_ol]:text-slate-300
            [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:bg-white/10 [&_code]:text-purple-300 [&_code]:font-mono [&_code]:text-xs
            [&_pre]:p-4 [&_pre]:rounded-2xl [&_pre]:bg-black/60 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-white/10 [&_pre]:my-4
            [&_img]:rounded-2xl [&_img]:my-6 [&_img]:max-h-[500px] [&_img]:w-full [&_img]:object-cover [&_img]:border [&_img]:border-white/10
          "
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      )}

      {/* 2. Structured Tabular Data Component (if explicit tableData is available) */}
      {tableData && tableData.headers && tableData.rows && tableData.rows.length > 0 && (
        <div className="my-8 rounded-2xl bg-[#080d22] border border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-950/20">
          <div className="px-5 py-3 bg-[#0d1430] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Article Data & Release Index
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {tableData.rows.length} {tableData.rows.length === 1 ? 'Entry' : 'Entries'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-purple-950/50 border-b border-white/10">
                <tr>
                  {tableData.headers.map((h, i) => (
                    <th
                      key={i}
                      className="p-3.5 text-cyan-300 font-bold font-mono tracking-wider uppercase text-xs"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tableData.rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-white/[0.03] transition-colors even:bg-white/[0.015]"
                  >
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3.5 text-slate-300 leading-normal align-middle">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Citations & Verified Sources Box */}
      {citations && citations.length > 0 && (
        <div className="my-8 p-5 rounded-2xl bg-[#090d21] border border-purple-500/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold font-mono text-purple-300 uppercase tracking-wider">
            <Link2 className="w-4 h-4 text-purple-400" />
            <span>Verified Sources & Grounded Citations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {citations.map((cite, idx) => (
              <a
                key={idx}
                href={cite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-slate-200 group-hover:text-cyan-300 truncate font-medium">
                    {cite.title || 'Source Reference'}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 flex-shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
