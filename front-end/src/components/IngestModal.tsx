import React, { useState } from 'react';
import { Article, ArticleCategory, NewsType } from '../types';
import { CATEGORIES, NEWS_TYPES } from '../data/mockArticles';
import { X, Plus, FileCode } from 'lucide-react';
import { inferCategoryFallback, inferNewsTypeFallback } from '../data/heuristics';

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngest: (article: Article) => void;
}

export const IngestModal: React.FC<IngestModalProps> = ({
  isOpen,
  onClose,
  onIngest
}) => {
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [sourcesText, setSourcesText] = useState('DeepMind Research, arXiv:2609.99120');
  const [category, setCategory] = useState<ArticleCategory>('LLMs & Reasoning');
  const [type, setType] = useState<NewsType>('Breakthroughs');
  const [isTopFive, setIsTopFive] = useState(true);
  const [rawJsonMode, setRawJsonMode] = useState(false);
  const [url, setUrl] = useState('https://arxiv.org/abs/2609.16781');
  const [publishedDate, setPublishedDate] = useState('2026-09-30 20:00:00');
  const [rawJson, setRawJson] = useState(`{
  "headline": "Sparse Attention Distillation Compresses Long-Context Latency by 5x",
  "summary": "Novel linear attention heads selectively cache KV pairs based on query entropy, allowing million-token context windows with fixed memory footprint.",
  "news_type": "Breakthroughs",
  "category": "LLMs & Reasoning",
  "overview": "Researchers introduced entropy-directed sparse attention kernels that compress intermediate KV caches during long-context generation passes.",
  "analysis": "By deploying entropy thresholding on query matrices, memory bandwidth requirements are lowered by 78% on consumer GPUs while maintaining perplexity scores within 0.02 of uncompressed baselines.",
  "key_takeaways": [
    "5x reduction in long-context inference latency.",
    "Constant GPU memory footprint across 1M token contexts.",
    "Seamless fallback to dense attention on high-entropy tokens."
  ],
  "sources": ["OpenAI Research", "arXiv:2609.16781"],
  "primary_citations_repositories": [
    {
      "label": "arXiv:2609.16781 [cs.CL]",
      "url": "https://arxiv.org/abs/2609.16781"
    }
  ],
  "url": "https://arxiv.org/abs/2609.16781",
  "published_date": "2026-09-30 20:00:00"
}`);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rawJsonMode) {
      try {
        const parsed = JSON.parse(rawJson);
        const newArticle: Article = {
          id: Date.now(),
          headline: parsed.headline || 'Untitled Intelligence Brief',
          summary: parsed.summary || 'No summary provided.',
          sources: Array.isArray(parsed.sources) ? parsed.sources : ['Internal Newsroom Wire'],
          url: parsed.url || '#',
          published_date: parsed.published_date || new Date().toISOString().replace('T', ' ').slice(0, 19),
          category: (parsed.category || inferCategoryFallback(parsed.headline || '', parsed.summary || '', parsed.sources || [])) as Exclude<ArticleCategory, 'All'>,
          type: (parsed.news_type || parsed.type || inferNewsTypeFallback(parsed.headline || '', parsed.summary || '', parsed.sources || [])) as Exclude<NewsType, 'All'>,
          timestamp: 'Just now',
          date: '2026-09-30',
          readingTime: '2 min',
          isTopFiveDaily: true,
          overview: parsed.overview || parsed.summary,
          fullAnalysis: parsed.analysis || parsed.fullAnalysis || parsed.summary,
          keyTakeaways: parsed.key_takeaways || parsed.keyTakeaways || [],
          primary_citations_repositories: parsed.primary_citations_repositories || []
        };
        onIngest(newArticle);
        onClose();
        return;
      } catch (err) {
        alert('Invalid JSON format. Please verify the syntax.');
        return;
      }
    }

    if (!headline.trim()) return;

    const sources = sourcesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newArticle: Article = {
      id: Date.now(),
      headline: headline.trim(),
      summary: summary.trim() || 'Executive intelligence brief synthesized for daily AI monitoring.',
      sources: sources.length > 0 ? sources : ['AI Newsroom Wire'],
      url: url.trim() || '#',
      published_date: publishedDate.trim() || new Date().toISOString().replace('T', ' ').slice(0, 19),
      category: category === 'All' ? 'LLMs & Reasoning' : category,
      type: type === 'All' ? 'Breakthroughs' : type,
      timestamp: 'Just now',
      date: '2026-09-30',
      readingTime: '2 min',
      isTopFiveDaily: isTopFive,
      fullAnalysis: summary.trim()
    };

    onIngest(newArticle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] border-2 border-[#1B1B19] shadow-[8px_8px_0_#1B1B19] max-w-lg w-full p-6 text-[#1B1B19] space-y-5">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#1B1B19]">
          <div className="label-mono font-bold text-[#1B1B19] flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#E15D44]" />
            <span>[INGEST_SIMULATOR] JSON SYNC</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 border border-[#1B1B19] hover:bg-[#1B1B19] hover:text-[#F8F7F4] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="label-mono text-[#1B1B19]/70">
            SIMULATE DROP IN: <code className="bg-[#F8F7F4] border border-[#1B1B19]/30 px-1 py-0.5">~/NewsroomTest/*.json</code>
          </span>
          <button
            type="button"
            onClick={() => setRawJsonMode(!rawJsonMode)}
            className="label-mono text-[#E15D44] hover:underline flex items-center gap-1 font-bold"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{rawJsonMode ? 'FORM VIEW' : 'RAW JSON'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {rawJsonMode ? (
            <div>
              <label className="block label-mono font-bold text-[#1B1B19] mb-1">
                JSON PAYLOAD (FASTAPI SCHEMA)
              </label>
              <textarea
                rows={8}
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                className="w-full bg-[#F8F7F4] border-1.5 border-[#1B1B19] p-3 font-mono-code text-xs text-[#1B1B19] focus:outline-none focus:border-[#E15D44]"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block label-mono font-bold text-[#1B1B19] mb-1">
                  HEADLINE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontier Reasoning Model Surpasses 90% on Formal Math Olympiad"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-[#F8F7F4] border-1.5 border-[#1B1B19] px-3 py-2 text-xs text-[#1B1B19] focus:outline-none focus:border-[#E15D44]"
                />
              </div>

              <div>
                <label className="block label-mono font-bold text-[#1B1B19] mb-1">
                  EXECUTIVE SUMMARY
                </label>
                <textarea
                  rows={3}
                  placeholder="Concise 2-3 sentence overview..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-[#F8F7F4] border-1.5 border-[#1B1B19] p-3 text-xs text-[#1B1B19] focus:outline-none focus:border-[#E15D44]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block label-mono font-bold text-[#1B1B19] mb-1">
                    NEWS TYPE
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as NewsType)}
                    className="w-full bg-[#F8F7F4] border-1.5 border-[#1B1B19] px-2.5 py-1.5 text-xs text-[#1B1B19] focus:outline-none focus:border-[#E15D44] font-mono-code"
                  >
                    {NEWS_TYPES.filter(t => t.label !== 'All').map(t => (
                      <option key={t.label} value={t.label}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block label-mono font-bold text-[#1B1B19] mb-1">
                    CATEGORY
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ArticleCategory)}
                    className="w-full bg-[#F8F7F4] border-1.5 border-[#1B1B19] px-2.5 py-1.5 text-xs text-[#1B1B19] focus:outline-none focus:border-[#E15D44] font-mono-code"
                  >
                    {CATEGORIES.filter(c => c.label !== 'All').map(c => (
                      <option key={c.label} value={c.label}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block label-mono font-bold text-[#1B1B19] mb-1">
                  SOURCES (COMMA SEPARATED)
                </label>
                <input
                  type="text"
                  placeholder="arXiv:2609.12345, DeepMind Research"
                  value={sourcesText}
                  onChange={(e) => setSourcesText(e.target.value)}
                  className="w-full bg-[#F8F7F4] border-1.5 border-[#1B1B19] px-3 py-1.5 text-xs text-[#1B1B19] focus:outline-none focus:border-[#E15D44] font-mono-code"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block label-mono font-bold text-[#1B1B19] mb-1">
                    ARTICLE URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://arxiv.org/abs/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-[#F8F7F4] border-1.5 border-[#1B1B19] px-3 py-1.5 text-xs text-[#1B1B19] focus:outline-none focus:border-[#E15D44] font-mono-code"
                  />
                </div>
                <div>
                  <label className="block label-mono font-bold text-[#1B1B19] mb-1">
                    PUBLISHED DATE
                  </label>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD HH:MM:SS"
                    value={publishedDate}
                    onChange={(e) => setPublishedDate(e.target.value)}
                    className="w-full bg-[#F8F7F4] border-1.5 border-[#1B1B19] px-3 py-1.5 text-xs text-[#1B1B19] focus:outline-none focus:border-[#E15D44] font-mono-code"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="topFiveCheck"
                  checked={isTopFive}
                  onChange={(e) => setIsTopFive(e.target.checked)}
                  className="w-4 h-4 border-1.5 border-[#1B1B19] rounded-none accent-[#E15D44] text-[#E15D44]"
                />
                <label htmlFor="topFiveCheck" className="label-mono font-bold text-[#1B1B19] cursor-pointer">
                  PROMOTE TO TOP 5 OF DAY
                </label>
              </div>
            </>
          )}

          <div className="pt-3 border-t-2 border-[#1B1B19] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="editorial-btn-outline px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="editorial-btn px-4 py-2 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulate Ingestion</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
