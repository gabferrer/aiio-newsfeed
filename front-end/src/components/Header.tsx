import React from 'react';
import { Search, Bookmark, SlidersHorizontal, X } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  bookmarkedOnly: boolean;
  onToggleBookmarkedOnly: () => void;
  bookmarkedCount: number;
  mobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  backendStatus: {
    status: 'connected' | 'connecting' | 'error' | 'mixed_content';
    count: number;
  };
  onOpenApiSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  bookmarkedOnly,
  onToggleBookmarkedOnly,
  bookmarkedCount,
  mobileSidebarOpen,
  onToggleMobileSidebar,
  backendStatus,
  onOpenApiSettings
}) => {
  return (
    <header className="v1-header">
      {/* Brand Header */}
      <div className="flex items-center gap-3">
        <button 
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1 text-[#1B1B19] border border-[#1B1B19] hover:bg-[#1B1B19] hover:text-[#F8F7F4] transition-colors"
          aria-label="Toggle navigation"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-start">
          <div 
            className="text-white font-mono text-[0.68rem] tracking-wider px-1.5 py-0.5 leading-tight"
            style={{ backgroundColor: '#DE7158', textTransform: 'none' }}
          >
            [00] AIIO_Use
          </div>
          <div 
            className="text-white font-medium text-[1.1rem] tracking-[-0.02em] px-1.5 py-0.5 leading-tight"
            style={{ backgroundColor: '#E15D44' }}
          >
            Automated AI Newsfeed
          </div>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="hidden md:flex items-center flex-1 max-w-sm mx-6">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search briefs..."
            className="w-full bg-[#FFFFFF] border border-[#1B1B19] pl-8 pr-7 py-1 text-xs text-[#1B1B19] font-mono focus:outline-none focus:ring-1 focus:ring-[#1B1B19]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Controls: SAVED (0) and Backend Status button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenApiSettings}
          className="btn-outline text-[0.65rem] py-1.5 px-2.5 flex items-center gap-1.5 cursor-pointer font-mono"
          title={`Backend status: ${backendStatus.status} (${backendStatus.count} articles). Click to configure API endpoint.`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${
            backendStatus.status === 'connected'
              ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]'
              : backendStatus.status === 'connecting'
              ? 'bg-amber-500 animate-pulse'
              : 'bg-[#E15D44]'
          }`} />
          <span className="hidden sm:inline">
            {backendStatus.status === 'connected' ? `SYNCED (${backendStatus.count})` : 'BACKEND'}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleBookmarkedOnly}
          className={`btn-outline text-[0.65rem] py-1.5 px-2.5 ${bookmarkedOnly ? 'bg-[#E15D44] text-white border-[#E15D44]' : ''}`}
          title="Filter saved briefs"
        >
          <Bookmark className={`w-3 h-3 inline mr-1 ${bookmarkedOnly ? 'fill-current' : ''}`} />
          <span>Saved ({bookmarkedCount})</span>
        </button>
      </div>
    </header>
  );
};
