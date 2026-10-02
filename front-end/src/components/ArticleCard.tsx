import React, { useState } from 'react';
import { Article } from '../types';
import { Bookmark, Copy, Check } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  rank?: number; // 1 to 5 for top 5
  isBookmarked: boolean;
  onToggleBookmark: (id: number) => void;
  onSelectArticle: (article: Article) => void;
}

function extractCleanUrl(rawUrl?: string): string {
  if (!rawUrl) return '#';
  const match = rawUrl.match(/https?:\/\/[^ \)]+/);
  return match ? match[0] : rawUrl;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  rank,
  isBookmarked,
  onToggleBookmark,
  onSelectArticle
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `${article.headline}\n\n${article.summary}\n\nSources: ${article.sources.join(', ')}${article.url ? `\nLink: ${article.url}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const safeUrl = extractCleanUrl(article.url);
  const dateStr = (article.published_date && article.published_date.trim() !== '')
    ? article.published_date
    : (article.timestamp || 'UNTIMED BRIEF');

  // Exact Card Structure from Variation 1 with url and published_date support
  return (
    <div 
      className="card"
      onClick={() => onSelectArticle(article)}
      style={{ cursor: 'pointer' }}
    >
      {/* Top Label (Matches Variation 1: <div class="label">Top #1 // LLMs & Reasoning</div> + published_date) */}
      <div className="flex items-center justify-between">
        <div className="label">
          {rank ? `Top #${rank} // ${article.category}` : `Brief // ${article.category}`}
          <span style={{ margin: '0 6px', opacity: 0.5 }}>·</span>
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-1 opacity-70 hover:opacity-100">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 hover:text-[#E15D44] transition-colors"
            title="Copy brief summary"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#E15D44]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(article.id);
            }}
            className={`p-1 hover:text-[#E15D44] transition-colors ${
              isBookmarked ? 'text-[#E15D44]' : 'text-[#1B1B19]'
            }`}
            title={isBookmarked ? "Remove bookmark" : "Save for later"}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Headline (Matches Variation 1: <h2 style="font-size: 1.5rem; margin: 0.5rem 0;">...</h2>) */}
      <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0', fontWeight: 700, lineHeight: 1.25 }}>
        {article.headline}
      </h2>

      {/* Summary (Matches Variation 1: <p style="opacity: 0.8; max-width: 60ch;">...</p>) */}
      <p style={{ opacity: 0.8, maxWidth: '60ch', lineHeight: 1.6, margin: 0 }}>
        {article.summary}
      </p>

      {/* Sources list (static, non-clickable per user condition) */}
      <div className="label" style={{ marginTop: '0.75rem', opacity: 0.6 }}>
        Sources: {article.sources.join(', ')}
      </div>

      {/* Action Buttons: Read Full Brief + View Article -> */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button 
          className="btn" 
          onClick={(e) => {
            e.stopPropagation();
            onSelectArticle(article);
          }}
        >
          Read Full Brief
        </button>

        {safeUrl && safeUrl !== '#' ? (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
            onClick={(e) => e.stopPropagation()}
            title="Open canonical article in new tab"
          >
            View Article →
          </a>
        ) : (
          <span className="label" style={{ opacity: 0.4, marginLeft: '0.25rem' }}>
            NO URL
          </span>
        )}
      </div>
    </div>
  );
};
