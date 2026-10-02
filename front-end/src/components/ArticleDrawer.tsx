import React, { useEffect, useState, useCallback } from 'react';
import { Article } from '../types';
import { X, Copy, Check, Bookmark, ExternalLink } from 'lucide-react';

interface ArticleDrawerProps {
  article: Article | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: number) => void;
}

function formatToMonthDDYYYY(dateInput?: string): string {
  if (!dateInput) return 'Recent';
  const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const year = match[1];
    const month = months[parseInt(match[2], 10) - 1];
    const day = parseInt(match[3], 10);
    return `${month} ${day}, ${year}`;
  }
  return dateInput;
}

export const ArticleDrawer: React.FC<ArticleDrawerProps> = ({
  article,
  onClose,
  isBookmarked,
  onToggleBookmark
}) => {
  const [copied, setCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Reset isClosing whenever a new article opens
  useEffect(() => {
    if (article) {
      setIsClosing(false);
    }
  }, [article?.id]);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 220);
  }, [isClosing, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  if (!article) return null;

  const handleCopyReport = () => {
    const text = `[INTELLIGENCE DISPATCH - ${article.type.toUpperCase()}]\n\n${article.headline}\n\nDate: ${article.date} (${article.timestamp})\nCategory: ${article.category}\nSources: ${article.sources.join(', ')}\n\nSUMMARY:\n${article.summary}\n\nFULL ANALYSIS:\n${article.fullAnalysis || article.summary}\n\nKEY TAKEAWAYS:\n${(article.keyTakeaways || []).map(t => `• ${t}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Full-screen Backdrop */}
      <div 
        onClick={handleClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs cursor-pointer ${
          isClosing ? 'animate-backdrop-fade-out' : 'animate-backdrop-fade'
        }`}
      />

      {/* Drawer Panel */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-screen max-w-2xl bg-[#F8F7F4] border-l-2 border-[#1B1B19] shadow-2xl flex flex-col h-full ${
          isClosing ? 'animate-drawer-slide-out' : 'animate-drawer-slide'
        }`}
      >
          {/* Header */}
          <div className="p-5 border-b-2 border-[#1B1B19] flex items-center justify-between gap-4 bg-[#FFFFFF]">
            <div />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyReport}
                className="editorial-btn-outline px-3 py-1.5 flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#E15D44]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'COPIED' : 'COPY BRIEF'}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleBookmark(article.id)}
                className={`p-1.5 border border-[#1B1B19] transition-colors ${
                  isBookmarked ? 'bg-[#E15D44] text-white' : 'bg-[#FFFFFF] text-[#1B1B19] hover:bg-[#1B1B19] hover:text-[#F8F7F4]'
                }`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark brief'}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 border border-[#1B1B19] bg-[#FFFFFF] hover:bg-[#1B1B19] hover:text-[#F8F7F4] transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* Metadata strip */}
            <div className="label-mono font-bold text-[#1B1B19]/70 flex items-center gap-2 flex-wrap pb-3 border-b border-[#1B1B19]/20">
              <span className="text-[#1B1B19]">{article.category}</span>
              <span aria-hidden="true">/</span>
              <span>{article.type}</span>
              <span aria-hidden="true">/</span>
              <span>{formatToMonthDDYYYY(article.published_date || article.date)}</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1B19] leading-tight tracking-tight">
              {article.headline}
            </h1>

            {/* Outbound Link Button if URL exists */}
            {article.url && article.url !== '#' && (
              <div>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="editorial-btn px-4 py-2 inline-flex items-center gap-2 text-xs"
                >
                  <span>Open Article</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Overview */}
            <div className="p-5 bg-[#FFFFFF] border-1.5 border-[#1B1B19] space-y-2">
              <div className="label-mono text-[#E15D44] font-bold">
                Overview
              </div>
              <p className="text-sm sm:text-base text-[#1B1B19] leading-relaxed font-normal">
                {article.overview || article.summary}
              </p>
            </div>

            {/* In-depth Analysis */}
            {article.fullAnalysis && (
              <div className="space-y-2">
                <h3 className="label-mono font-bold text-[#1B1B19]">
                  Technical & Market Analysis
                </h3>
                <p className="text-sm sm:text-base text-[#1B1B19]/80 leading-relaxed font-normal">
                  {article.fullAnalysis}
                </p>
              </div>
            )}

            {/* Key Takeaways */}
            {article.keyTakeaways && article.keyTakeaways.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="label-mono font-bold text-[#1B1B19]">
                  Key Takeaways
                </h3>
                <ul className="space-y-2 text-sm text-[#1B1B19]/90 font-normal">
                  {article.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-[#E15D44] font-mono-code font-bold text-xs mt-0.5 shrink-0">↳</span>
                      <span className="leading-relaxed">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sources & Citations */}
            {((article.primary_citations_repositories && article.primary_citations_repositories.length > 0) || (article.sources && article.sources.length > 0)) && (
              <div className="pt-4 border-t border-[#1B1B19]/20 space-y-3">
                <h3 className="label-mono font-bold text-[#1B1B19]">
                  Primary Citations & Repositories
                </h3>
                <div className="space-y-2">
                  {article.primary_citations_repositories && article.primary_citations_repositories.length > 0 ? (
                    article.primary_citations_repositories.map((citation, idx) => (
                      <a
                        key={idx}
                        href={citation.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-[#FFFFFF] border border-[#1B1B19] flex items-center justify-between gap-3 text-xs font-mono-code text-[#1B1B19] group hover:border-[#E15D44] hover:bg-[#1B1B19]/5 transition-colors cursor-pointer"
                      >
                        <span className="font-bold truncate">{citation.label || citation.url}</span>
                        <span className="text-[10px] text-[#E15D44] group-hover:text-[#1B1B19] flex items-center gap-1 shrink-0 font-bold">
                          VERIFIED <ExternalLink className="w-3 h-3 text-[#E15D44] group-hover:text-[#1B1B19]" />
                        </span>
                      </a>
                    ))
                  ) : (
                    article.sources.map((src, idx) => (
                      <div 
                        key={idx}
                        className="p-3 bg-[#FFFFFF] border border-[#1B1B19] flex items-center justify-between gap-3 text-xs font-mono-code text-[#1B1B19]"
                      >
                        <span className="font-bold truncate">{src}</span>
                        <span className="text-[10px] text-[#E15D44] flex items-center gap-1 shrink-0 font-bold">
                          VERIFIED <ExternalLink className="w-3 h-3 text-[#E15D44]" />
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
