import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Article, FilterState, NewsType, ArticleCategory } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ArticleCard } from './components/ArticleCard';
import { ArticleDrawer } from './components/ArticleDrawer';
import { IngestModal } from './components/IngestModal';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { ChevronDown, ArrowDown, AlertTriangle, RefreshCw, Bookmark } from 'lucide-react';
import { 
  inferCategoryFallback, 
  inferNewsTypeFallback, 
  normalizeNewsType, 
  normalizeCategory 
} from './data/heuristics';

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/news';

export default function App() {
  const [apiUrl, setApiUrl] = useState(() => {
    return localStorage.getItem('newsroom_api_url') || DEFAULT_API_URL;
  });

  const [backendStatus, setBackendStatus] = useState<{
    status: 'connected' | 'connecting' | 'error' | 'mixed_content';
    count: number;
    lastChecked?: string;
    errorMessage?: string;
  }>({
    status: 'connecting',
    count: 0
  });

  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const hasLoadedLiveRef = useRef(false);
  const [articles, setArticles] = useState<Article[]>(() => {
    const saved = localStorage.getItem('newsroom_articles_v1');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((a: any) => ({
            ...a,
            type: normalizeNewsType(a.type || a.news_type),
            category: normalizeCategory(a.category)
          }));
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [pendingArticles, setPendingArticles] = useState<Article[] | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('newsroom_bookmarks_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Calculate actual valid bookmarks whose IDs exist in the current articles database
  const validBookmarkedIds = useMemo(() => {
    const articleIds = new Set(articles.map(a => a.id));
    return bookmarkedIds.filter(id => articleIds.has(id));
  }, [articles, bookmarkedIds]);

  const validBookmarkedCount = validBookmarkedIds.length;

  // Automatically prune orphaned bookmark IDs when database updates or is cleared
  useEffect(() => {
    if (hasLoadedLiveRef.current) {
      const articleIds = new Set(articles.map(a => a.id));
      const valid = bookmarkedIds.filter(id => articleIds.has(id));
      if (valid.length !== bookmarkedIds.length) {
        setBookmarkedIds(valid);
        localStorage.setItem('newsroom_bookmarks_v1', JSON.stringify(valid));
      }
    }
  }, [articles, bookmarkedIds]);

  const [visibleCount, setVisibleCount] = useState<number>(5);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedType: 'All',
    selectedCategory: 'All',
    selectedSource: 'All Sources',
    onlyTopFive: true,
    bookmarkedOnly: false
  });

  useEffect(() => {
    localStorage.setItem('newsroom_articles_v1', JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem('newsroom_bookmarks_v1', JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  // Robust scroll listener for floating Return to Top button
  useEffect(() => {
    const handleScroll = () => {
      const mainEl = document.querySelector('.v1-main');
      const windowScroll = Math.max(
        window.scrollY || 0,
        window.pageYOffset || 0,
        document.documentElement.scrollTop || 0,
        document.body.scrollTop || 0
      );
      const mainScroll = mainEl ? mainEl.scrollTop : 0;
      const currentScroll = Math.max(windowScroll, mainScroll);
      setShowScrollTop(currentScroll > 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    const mainEl = document.querySelector('.v1-main');
    if (mainEl) mainEl.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      document.removeEventListener('scroll', handleScroll, { capture: true });
      if (mainEl) mainEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
    const mainEl = document.querySelector('.v1-main');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearLocalCache = () => {
    localStorage.removeItem('newsroom_articles_v1');
    localStorage.removeItem('newsroom_bookmarks_v1');
    setArticles([]);
    setPendingArticles(null);
    setBookmarkedIds([]);
    fetchBackendNews();
  };

  // Live FastAPI 5s Polling with staged update banner support and robust error diagnostics
  const fetchBackendNews = useCallback(async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || apiUrl).trim();
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isTargetLocalHttp = targetUrl.startsWith('http://127.0.0.1') || targetUrl.startsWith('http://localhost');

    try {
      const response = await fetch(targetUrl);
      if (!response.ok) {
        setBackendStatus({
          status: 'error',
          count: 0,
          lastChecked: new Date().toLocaleTimeString(),
          errorMessage: `HTTP ${response.status}: ${response.statusText}`
        });
        return;
      }
      const incoming = await response.json();

      if (Array.isArray(incoming)) {
        setBackendStatus({
          status: 'connected',
          count: incoming.length,
          lastChecked: new Date().toLocaleTimeString(),
          errorMessage: incoming.length === 0 ? 'Backend connected, but articles table in SQLite is empty.' : undefined
        });

        // CRITICAL FIX: If database was cleared (incoming is empty), immediately empty articles, pending updates, and archive
        if (incoming.length === 0) {
          hasLoadedLiveRef.current = true;
          setArticles([]);
          setPendingArticles(null);
          setBookmarkedIds([]);
          localStorage.setItem('newsroom_articles_v1', JSON.stringify([]));
          localStorage.setItem('newsroom_bookmarks_v1', JSON.stringify([]));
          return;
        }

        const formatted: Article[] = incoming.map((item: any, idx: number) => ({
          id: typeof item.id === 'number' ? item.id : 1000 + idx,
          headline: item.headline || 'Untitled Brief',
          summary: item.summary || '',
          sources: Array.isArray(item.sources) ? item.sources : ['AI Newsroom Wire'],
          url: item.url || '#',
          published_date: item.published_date || undefined,
          category: item.category 
            ? normalizeCategory(item.category) 
            : inferCategoryFallback(item.headline, item.summary, item.sources),
          type: item.news_type 
            ? normalizeNewsType(item.news_type) 
            : inferNewsTypeFallback(item.headline, item.summary, item.sources),
          timestamp: item.published_date ? '' : 'Recent',
          date: item.published_date ? item.published_date.split(' ')[0] : '2026-09-30',
          readingTime: '2 min',
          isTopFiveDaily: true,
          
          // Map new editorial fields from FastAPI
          overview: item.overview || item.summary,
          fullAnalysis: item.analysis || item.summary,
          keyTakeaways: item.key_takeaways || [],
          primary_citations_repositories: item.primary_citations_repositories || []
        }));

        setArticles((current) => {
          // If this is the initial sync from the live backend, replace placeholder mock articles immediately!
          if (!hasLoadedLiveRef.current) {
            hasLoadedLiveRef.current = true;
            return formatted;
          }

          // Create signature to detect actual updates/changes
          const currentSignature = current.map(a => `${a.id}:${a.headline}`).join('|');
          const incomingSignature = formatted.map(a => `${a.id}:${a.headline}`).join('|');

          if (currentSignature !== incomingSignature) {
            // If items were deleted (e.g. database cleared or reduced), update immediately without waiting for scroll!
            if (formatted.length < current.length) {
              return formatted;
            }

            const mainEl = document.querySelector('.v1-main');
            const isScrolled = (window.scrollY > 200) || (mainEl && mainEl.scrollTop > 200);

            if (isScrolled) {
              setPendingArticles(formatted);
              return current; // keep current view stable while user reads
            } else {
              return formatted;
            }
          }
          return current;
        });
      }
    } catch (err: any) {
      if (isHttps && isTargetLocalHttp) {
        setBackendStatus({
          status: 'mixed_content',
          count: 0,
          lastChecked: new Date().toLocaleTimeString(),
          errorMessage: 'Browser Mixed Content Block: HTTPS origin cannot fetch insecure http://127.0.0.1:8000.'
        });
        console.warn('[AI Newsroom] Browser Mixed Content Block: HTTPS origin cannot fetch', targetUrl);
      } else {
        setBackendStatus({
          status: 'error',
          count: 0,
          lastChecked: new Date().toLocaleTimeString(),
          errorMessage: err.message || 'Cannot reach FastAPI server. Verify uvicorn is running on port 8000.'
        });
      }
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchBackendNews();
    const interval = setInterval(() => {
      fetchBackendNews();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchBackendNews]);

  const handleSaveApiUrl = (newUrl: string) => {
    setApiUrl(newUrl);
    localStorage.setItem('newsroom_api_url', newUrl);
    hasLoadedLiveRef.current = false;
  };

  const handleApplyPendingUpdates = () => {
    if (pendingArticles) {
      setArticles(pendingArticles);
      setPendingArticles(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const mainEl = document.querySelector('.v1-main');
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleToggleBookmark = (id: number) => {
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    // Automatically switch onlyTopFive to false ("All Briefs") when picking a specific type, category, or source
    const isPickingType = newFilters.selectedType !== undefined && newFilters.selectedType !== 'All';
    const isPickingCategory = newFilters.selectedCategory !== undefined && newFilters.selectedCategory !== 'All';
    const isPickingSource = newFilters.selectedSource !== undefined && newFilters.selectedSource !== 'All Sources';

    const shouldAutoSwitchToAll = isPickingType || isPickingCategory || isPickingSource;

    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      if (shouldAutoSwitchToAll) {
        updated.onlyTopFive = false;
      }
      // When a type is selected, verify if the currently chosen category still exists under that type
      if (updated.selectedType !== 'All' && updated.selectedCategory !== 'All') {
        const hasMatching = articles.some(
          a => a.type === updated.selectedType && a.category === updated.selectedCategory
        );
        if (!hasMatching) {
          updated.selectedCategory = 'All';
        }
      }

      // When a type or category is selected, verify if the currently chosen source still exists
      if (updated.selectedSource !== 'All Sources') {
        const hasMatchingSource = articles.some(a => {
          if (updated.selectedType !== 'All' && a.type !== updated.selectedType) return false;
          if (updated.selectedCategory !== 'All' && a.category !== updated.selectedCategory) return false;
          return a.sources.some(s => s.trim().toLowerCase() === updated.selectedSource.trim().toLowerCase());
        });
        if (!hasMatchingSource) {
          updated.selectedSource = 'All Sources';
        }
      }
      return updated;
    });

    if (newFilters.onlyTopFive === true && !shouldAutoSwitchToAll) {
      setVisibleCount(5);
    } else if (newFilters.onlyTopFive === false || shouldAutoSwitchToAll) {
      setVisibleCount(15);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      selectedType: 'All',
      selectedCategory: 'All',
      selectedSource: 'All Sources',
      onlyTopFive: true,
      bookmarkedOnly: false
    });
    setVisibleCount(5);
  };

  const isFiltered = useMemo(() => {
    return (
      filters.searchQuery.trim() !== '' ||
      filters.selectedType !== 'All' ||
      filters.selectedCategory !== 'All' ||
      filters.selectedSource !== 'All Sources' ||
      !filters.onlyTopFive ||
      filters.bookmarkedOnly
    );
  }, [filters]);

  const articlesCountByType = useMemo(() => {
    const counts: Record<string, number> = {};
    articles.forEach(a => {
      const canonical = normalizeNewsType(a.type);
      counts[canonical] = (counts[canonical] || 0) + 1;
      counts[canonical.toUpperCase()] = counts[canonical];
    });
    return counts;
  }, [articles]);

  const articlesCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    const relevantArticles = filters.selectedType !== 'All'
      ? articles.filter(a => normalizeNewsType(a.type) === normalizeNewsType(filters.selectedType))
      : articles;

    relevantArticles.forEach(a => {
      const canonical = normalizeCategory(a.category);
      counts[canonical] = (counts[canonical] || 0) + 1;
      counts[canonical.toUpperCase()] = counts[canonical];
    });
    return counts;
  }, [articles, filters.selectedType]);

  const articlesCountBySource = useMemo(() => {
    const counts: Record<string, number> = {};
    const relevantArticles = articles.filter(a => {
      if (filters.selectedType !== 'All' && normalizeNewsType(a.type) !== normalizeNewsType(filters.selectedType)) return false;
      if (filters.selectedCategory !== 'All' && normalizeCategory(a.category) !== normalizeCategory(filters.selectedCategory)) return false;
      return true;
    });

    relevantArticles.forEach(a => {
      a.sources.forEach(src => {
        const trimmed = src.trim();
        if (trimmed) {
          counts[trimmed] = (counts[trimmed] || 0) + 1;
        }
      });
    });
    return counts;
  }, [articles, filters.selectedType, filters.selectedCategory]);

  const availableSources = useMemo(() => {
    const sourcesSet = new Set<string>();
    const relevantArticles = articles.filter(a => {
      if (filters.selectedType !== 'All' && normalizeNewsType(a.type) !== normalizeNewsType(filters.selectedType)) return false;
      if (filters.selectedCategory !== 'All' && normalizeCategory(a.category) !== normalizeCategory(filters.selectedCategory)) return false;
      return true;
    });

    relevantArticles.forEach(a => {
      (a.sources || []).forEach(src => {
        const trimmed = src.trim();
        if (trimmed) sourcesSet.add(trimmed);
      });
    });
    return ['All Sources', ...Array.from(sourcesSet).sort((a, b) => a.localeCompare(b))];
  }, [articles, filters.selectedType, filters.selectedCategory]);

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      // When viewing saved/archive articles, show all saved briefs regardless of onlyTopFive
      if (filters.bookmarkedOnly) {
        if (!validBookmarkedIds.includes(article.id)) {
          return false;
        }
      } else if (filters.onlyTopFive && !article.isTopFiveDaily) {
        return false;
      }

      if (filters.selectedType !== 'All' && normalizeNewsType(article.type) !== normalizeNewsType(filters.selectedType)) {
        return false;
      }
      if (filters.selectedCategory !== 'All' && normalizeCategory(article.category) !== normalizeCategory(filters.selectedCategory)) {
        return false;
      }
      if (
        filters.selectedSource !== 'All Sources' && 
        !article.sources.some(s => s.toLowerCase().includes(filters.selectedSource.toLowerCase()))
      ) {
        return false;
      }
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesHeadline = article.headline.toLowerCase().includes(q);
        const matchesSummary = article.summary.toLowerCase().includes(q);
        const matchesSource = article.sources.some(s => s.toLowerCase().includes(q));
        const matchesCategory = article.category.toLowerCase().includes(q);
        if (!matchesHeadline && !matchesSummary && !matchesSource && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [articles, filters, bookmarkedIds]);

  const displayedArticles = useMemo(() => {
    return filteredArticles.slice(0, visibleCount);
  }, [filteredArticles, visibleCount]);

  const hasMore = visibleCount < filteredArticles.length;

  const handleLoadMore = () => {
    if (filters.onlyTopFive) {
      setFilters(prev => ({ ...prev, onlyTopFive: false }));
      setVisibleCount(15);
    } else {
      setVisibleCount(prev => prev + 5);
    }
  };

  const handleIngestArticle = (newArticle: Article) => {
    setArticles(prev => [newArticle, ...prev]);
  };

  const pendingCount = pendingArticles 
    ? pendingArticles.filter(a => !articles.some(c => c.id === a.id)).length || 1 
    : 0;

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#1B1B19] flex flex-col font-sans selection:bg-[#E15D44] selection:text-white">
      {/* Header matching updated layout */}
      <Header
        searchQuery={filters.searchQuery}
        onSearchChange={(q) => handleFilterChange({ searchQuery: q })}
        bookmarkedOnly={filters.bookmarkedOnly}
        onToggleBookmarkedOnly={() => {
          setFilters(prev => {
            const next = !prev.bookmarkedOnly;
            return {
              ...prev,
              bookmarkedOnly: next,
              // When entering saved/archive mode, ensure onlyTopFive is false so all saved briefs appear
              onlyTopFive: next ? false : prev.onlyTopFive
            };
          });
        }}
        bookmarkedCount={validBookmarkedCount}
        mobileSidebarOpen={mobileSidebarOpen}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        backendStatus={backendStatus}
        onOpenApiSettings={() => setIsApiSettingsOpen(true)}
      />

      {/* Exact Variation 1 Layout grid: <div class="layout"> (No desktop collapsible sidebar per instructions) */}
      <div className="layout">
        {/* Exact Variation 1 Sidebar: <aside> */}
        <Sidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          isFiltered={isFiltered}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          articlesCountByType={articlesCountByType}
          articlesCountByCategory={articlesCountByCategory}
          articlesCountBySource={articlesCountBySource}
          availableSources={availableSources}
        />

        {/* Exact Variation 1 Main: <main> */}
        <main className="v1-main">
          {/* Mixed Content Alert Banner if browser blocked local backend */}
          {backendStatus.status === 'mixed_content' && (
            <div 
              onClick={() => setIsApiSettingsOpen(true)}
              className="mb-6 p-3 bg-amber-50 border-2 border-amber-400 text-amber-900 text-xs font-mono flex items-center justify-between gap-3 cursor-pointer hover:bg-amber-100 transition-colors shadow-xs"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Local Backend Blocked:</strong> Browser Mixed Content policy prevented fetching <code>{apiUrl}</code> from an HTTPS site. Click to configure HTTPS tunnel or run locally.
                </span>
              </div>
              <span className="underline font-bold shrink-0">Configure Sync →</span>
            </div>
          )}

          {/* Non-Disruptive "New Updates Available" Banner from indexv4 */}
          {pendingArticles && (
            <div
              className="cursor-pointer transition-colors"
              onClick={handleApplyPendingUpdates}
              style={{
                background: '#1B1B19',
                color: '#FFFFFF',
                borderLeft: '8px solid #E15D44',
                padding: '14px 24px',
                fontFamily: "'Space Mono', monospace",
                fontWeight: 'bold',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                marginBottom: '1.5rem',
                textAlign: 'center',
                borderBottom: '2px solid #1B1B19',
                letterSpacing: '0.05em'
              }}
            >
              ↑ {pendingCount} NEW UPDATE(S) ARRIVED · CLICK TO LOAD
            </div>
          )}

          {/* Dynamic Hero Heading based on active view */}
          <h1 className="hero-title">
            {filters.bookmarkedOnly ? (
              <>
                Saved Briefs<br />
                Archive
              </>
            ) : filters.onlyTopFive ? (
              <>
                Top 5 of<br />
                the Day
              </>
            ) : (
              <>
                AI Intelligence<br />
                Briefs
              </>
            )}
          </h1>

          {/* Top 5 Heading (shown when viewing Top 5, similar to All Briefs heading) */}
          {filters.onlyTopFive && !filters.bookmarkedOnly && (
            <div className="label mb-6 pb-2 border-b border-[rgba(0,0,0,0.1)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[#E15D44] font-bold">●</span>
                <span>
                  TOP BRIEFS
                  {filters.selectedType !== 'All' ? ` // ${filters.selectedType.toUpperCase()}` : ''}
                  {filters.selectedCategory !== 'All' ? ` // ${filters.selectedCategory.toUpperCase()}` : ''}
                  {filters.selectedSource !== 'All Sources' ? ` // ${filters.selectedSource.toUpperCase()}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] opacity-60">
                  {Math.min(5, filteredArticles.length)} OF {filteredArticles.length} BRIEFS
                </span>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="underline hover:text-[#E15D44] cursor-pointer"
                  >
                    RESET
                  </button>
                )}
              </div>
            </div>
          )}

          {/* All Briefs Heading */}
          {!filters.onlyTopFive && !filters.bookmarkedOnly && (
            <div className="label mb-6 pb-2 border-b border-[rgba(0,0,0,0.1)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>
                  ALL BRIEFS
                  {filters.selectedType !== 'All' ? ` // ${filters.selectedType.toUpperCase()}` : ''}
                  {filters.selectedCategory !== 'All' ? ` // ${filters.selectedCategory.toUpperCase()}` : ''}
                  {filters.selectedSource !== 'All Sources' ? ` // ${filters.selectedSource.toUpperCase()}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] opacity-60">{filteredArticles.length} BRIEFS</span>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="underline hover:text-[#E15D44] cursor-pointer"
                  >
                    RESET
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Archive / Saved Briefs Heading */}
          {filters.bookmarkedOnly && (
            <div className="label mb-6 pb-2 border-b border-[rgba(0,0,0,0.1)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-3 h-3 text-[#E15D44] fill-current" />
                <span>
                  ARCHIVE // SAVED BRIEFS
                  {filters.selectedType !== 'All' ? ` // ${filters.selectedType.toUpperCase()}` : ''}
                  {filters.selectedCategory !== 'All' ? ` // ${filters.selectedCategory.toUpperCase()}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] opacity-60">{filteredArticles.length} SAVED</span>
                <button
                  type="button"
                  onClick={() => handleFilterChange({ bookmarkedOnly: false, onlyTopFive: true })}
                  className="underline hover:text-[#E15D44] cursor-pointer"
                >
                  EXIT ARCHIVE
                </button>
              </div>
            </div>
          )}

          {/* Cards List matching Variation 1 */}
          {displayedArticles.length === 0 ? (
            <div className="card text-center py-12">
              <div className="label" style={{ marginBottom: '0.5rem' }}>
                {filters.bookmarkedOnly 
                  ? 'No Saved Briefs' 
                  : articles.length === 0 
                    ? 'Database Empty' 
                    : 'No Briefs Found'}
              </div>
              <p style={{ opacity: 0.8, maxWidth: '50ch', margin: '0 auto' }}>
                {filters.bookmarkedOnly
                  ? "You have not saved any briefs yet, or all saved briefs were removed when the database was cleared."
                  : articles.length === 0
                    ? "The backend database has been cleared or contains 0 articles. Ingest or generate new briefings to view them here."
                    : 'No articles match the current filter selection.'
                }
              </p>
              <div className="mt-4 flex gap-3 justify-center">
                {filters.bookmarkedOnly ? (
                  <button 
                    className="btn cursor-pointer" 
                    onClick={() => handleFilterChange({ bookmarkedOnly: false, onlyTopFive: true })}
                  >
                    Return To Top 5 Of Day
                  </button>
                ) : (
                  <>
                    {filters.onlyTopFive && articles.length > 0 && (
                      <button 
                        className="btn cursor-pointer" 
                        onClick={() => {
                          setFilters(prev => ({ ...prev, onlyTopFive: false }));
                          setVisibleCount(15);
                        }}
                      >
                        Switch To All Briefs
                      </button>
                    )}
                    {isFiltered && (
                      <button className="btn-outline cursor-pointer" onClick={handleResetFilters}>
                        Reset Filters
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            displayedArticles.map((article, index) => {
              // Only show Top #1-5 in the "Top 5 of the Day" tab without other filters, but not on all briefs tab or other filters
              const isTopFiveTabClean = 
                filters.onlyTopFive && 
                !filters.bookmarkedOnly &&
                filters.selectedType === 'All' &&
                filters.selectedCategory === 'All' &&
                filters.selectedSource === 'All Sources' &&
                !filters.searchQuery.trim();

              const rankNumber = (isTopFiveTabClean && index < 5) ? index + 1 : undefined;

              return (
                <ArticleCard
                  key={article.id}
                  article={article}
                  rank={rankNumber}
                  isBookmarked={bookmarkedIds.includes(article.id)}
                  onToggleBookmark={handleToggleBookmark}
                  onSelectArticle={setSelectedArticle}
                />
              );
            })
          )}

          {/* Subtle Load More Option */}
          <div className="my-8 flex justify-center">
            {hasMore ? (
              <button
                type="button"
                onClick={handleLoadMore}
                className="btn-outline flex items-center gap-2 cursor-pointer"
              >
                <span>Showing {displayedArticles.length} of {filteredArticles.length}</span>
                <span>//</span>
                <span>Load More Briefs</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            ) : filters.onlyTopFive && filteredArticles.length > 0 ? (
              <button
                type="button"
                onClick={handleLoadMore}
                className="btn-outline flex items-center gap-2 cursor-pointer"
              >
                <span>End of Top 5</span>
                <span>//</span>
                <span>Load Earlier Briefs</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            ) : displayedArticles.length > 0 ? (
              <div className="label opacity-50 text-center py-2">
                — All Briefs Loaded —
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {/* Floating Return to Top Button from indexv4 */}
      {showScrollTop && (
        <button
          type="button"
          onClick={handleScrollToTop}
          className="btn fixed bottom-7 right-7 z-50 shadow-[4px_4px_0_#E15D44] cursor-pointer"
          style={{
            padding: '10px 16px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}
          title="Return to top"
        >
          ↑ TOP
        </button>
      )}

      {/* Article Full Detail Drawer */}
      <ArticleDrawer
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        isBookmarked={selectedArticle ? bookmarkedIds.includes(selectedArticle.id) : false}
        onToggleBookmark={handleToggleBookmark}
      />

      {/* Ingest Modal */}
      <IngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngest={handleIngestArticle}
      />

      {/* Backend API Connection Diagnostics & Settings Modal */}
      <ApiSettingsModal
        isOpen={isApiSettingsOpen}
        onClose={() => setIsApiSettingsOpen(false)}
        apiUrl={apiUrl}
        onSaveUrl={handleSaveApiUrl}
        connectionStatus={backendStatus}
        onManualRefresh={() => fetchBackendNews()}
        onClearLocalCache={handleClearLocalCache}
      />
    </div>
  );
}
