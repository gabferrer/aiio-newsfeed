import React from 'react';
import { FilterState, NewsType, ArticleCategory } from '../types';
import { NEWS_TYPES, CATEGORIES, ALL_SOURCES } from '../data/mockArticles';
import { X, RotateCcw } from 'lucide-react';
import { normalizeNewsType, normalizeCategory } from '../data/heuristics';

interface SidebarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  isFiltered: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  articlesCountByType: Record<string, number>;
  articlesCountByCategory: Record<string, number>;
  articlesCountBySource: Record<string, number>;
  availableSources?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  isFiltered,
  mobileOpen,
  onCloseMobile,
  articlesCountByType,
  articlesCountByCategory,
  articlesCountBySource,
  availableSources
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`v1-aside fixed lg:static inset-y-0 left-0 z-40 bg-[#F8F7F4] w-72 shrink-0 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Top Row: Navigation Label from Variation 1 */}
          <div className="flex items-center justify-between">
            <div className="label" style={{ marginBottom: 0 }}>
              Navigation
            </div>
            <div className="flex items-center gap-2">
              {isFiltered && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="label text-[#E15D44] hover:text-[#1B1B19] flex items-center gap-1 font-bold cursor-pointer"
                  title="Reset filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESET</span>
                </button>
              )}
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1 text-[#1B1B19]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Exact Navigation List from Variation 1 */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="font-mono text-xs uppercase tracking-wider space-y-1">
            <li>
              <button
                type="button"
                onClick={() => onFilterChange({ 
                  onlyTopFive: true, 
                  bookmarkedOnly: false, 
                  selectedType: 'All', 
                  selectedCategory: 'All', 
                  selectedSource: 'All Sources' 
                })}
                className={`w-full text-left px-2 py-1.5 transition-colors cursor-pointer flex items-center justify-between ${
                  filters.onlyTopFive && !filters.bookmarkedOnly
                    ? 'bg-[#1B1B19] text-[#F8F7F4] font-bold'
                    : 'text-[#1B1B19] hover:bg-[#1B1B19]/5'
                }`}
              >
                <span>TOP 5 OF THE DAY</span>
                {filters.onlyTopFive && !filters.bookmarkedOnly && (
                  <span className="text-[10px] text-[#E15D44]">●</span>
                )}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onFilterChange({ onlyTopFive: false, bookmarkedOnly: false })}
                className={`w-full text-left px-2 py-1.5 transition-colors cursor-pointer flex items-center justify-between ${
                  !filters.onlyTopFive && !filters.bookmarkedOnly
                    ? 'bg-[#1B1B19] text-[#F8F7F4] font-bold'
                    : 'text-[#1B1B19] hover:bg-[#1B1B19]/5'
                }`}
              >
                <span>ALL BRIEFS</span>
                {!filters.onlyTopFive && !filters.bookmarkedOnly && (
                  <span className="text-[10px] text-[#E15D44]">●</span>
                )}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onFilterChange({ bookmarkedOnly: true, onlyTopFive: false })}
                className={`w-full text-left px-2 py-1.5 transition-colors cursor-pointer flex items-center justify-between ${
                  filters.bookmarkedOnly
                    ? 'bg-[#1B1B19] text-[#F8F7F4] font-bold'
                    : 'text-[#1B1B19] hover:bg-[#1B1B19]/5'
                }`}
              >
                <span>ARCHIVE</span>
                {filters.bookmarkedOnly && (
                  <span className="text-[10px] text-[#E15D44]">●</span>
                )}
              </button>
            </li>
          </ul>

          {/* Section: Type of AI News */}
          <div className="space-y-2 pt-2 border-t border-[rgba(0,0,0,0.1)]">
            <div className="label">Type of AI News</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="font-mono text-xs space-y-0.5">
              {NEWS_TYPES.map((typeObj) => {
                const isSelected = typeObj.label === 'All' 
                  ? filters.selectedType === 'All'
                  : (filters.selectedType !== 'All' && normalizeNewsType(filters.selectedType) === normalizeNewsType(typeObj.label));

                const count = typeObj.label === 'All' 
                  ? undefined 
                  : (articlesCountByType[typeObj.label] ?? 
                     articlesCountByType[typeObj.label.toUpperCase()] ?? 
                     articlesCountByType[normalizeNewsType(typeObj.label)] ?? 
                     0);

                return (
                  <li key={typeObj.label}>
                    <button
                      type="button"
                      onClick={() => onFilterChange({ 
                        selectedType: typeObj.label === 'All' ? 'All' : normalizeNewsType(typeObj.label) 
                      })}
                      className={`w-full text-left px-2 py-1 text-xs uppercase transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#1B1B19] text-[#F8F7F4] font-bold'
                          : 'text-[#1B1B19] hover:bg-[#1B1B19]/5'
                      }`}
                    >
                      <span className="truncate">{typeObj.label}</span>
                      {count !== undefined && (
                        <span className="text-[10px] opacity-60 ml-2">[{count}]</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Section: Category */}
          <div className="space-y-2 pt-2 border-t border-[rgba(0,0,0,0.1)]">
            <div className="label">Category</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="font-mono text-xs space-y-0.5">
              {CATEGORIES
                .filter((cat) => {
                  if (cat.label === 'All') return true;
                  // Dynamically hide categories that don't have briefs under the selected type
                  const count = articlesCountByCategory[cat.label] ?? 
                               articlesCountByCategory[cat.label.toUpperCase()] ?? 
                               articlesCountByCategory[normalizeCategory(cat.label)] ?? 
                               0;
                  return count > 0;
                })
                .map((cat) => {
                  const isSelected = cat.label === 'All'
                    ? filters.selectedCategory === 'All'
                    : (filters.selectedCategory !== 'All' && normalizeCategory(filters.selectedCategory) === normalizeCategory(cat.label));

                  const count = cat.label === 'All' 
                    ? undefined 
                    : (articlesCountByCategory[cat.label] ?? 
                       articlesCountByCategory[cat.label.toUpperCase()] ?? 
                       articlesCountByCategory[normalizeCategory(cat.label)] ?? 
                       0);

                return (
                  <li key={cat.label}>
                    <button
                      type="button"
                      onClick={() => onFilterChange({ 
                        selectedCategory: cat.label === 'All' ? 'All' : normalizeCategory(cat.label) 
                      })}
                      className={`w-full text-left px-2 py-1 text-xs uppercase transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#1B1B19] text-[#F8F7F4] font-bold'
                          : 'text-[#1B1B19] hover:bg-[#1B1B19]/5'
                      }`}
                    >
                      <span className="truncate">{cat.label}</span>
                      {count !== undefined && (
                        <span className="text-[10px] opacity-60 ml-2">[{count}]</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Section: Source Organization */}
          <div className="space-y-2 pt-2 border-t border-[rgba(0,0,0,0.1)]">
            <div className="label">Source</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="font-mono text-xs space-y-0.5 max-h-40 overflow-y-auto no-scrollbar">
              {(availableSources || ALL_SOURCES)
                .filter((src) => {
                  if (src === 'All Sources') return true;
                  const count = articlesCountBySource[src] || 0;
                  return count > 0;
                })
                .map((src) => {
                  const isSelected = filters.selectedSource === src;
                  const count = src === 'All Sources' ? undefined : (articlesCountBySource[src] || 0);

                  return (
                    <li key={src}>
                      <button
                        type="button"
                        onClick={() => onFilterChange({ selectedSource: src })}
                        className={`w-full text-left px-2 py-1 text-xs uppercase transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#1B1B19] text-[#F8F7F4] font-bold'
                            : 'text-[#1B1B19] hover:bg-[#1B1B19]/5'
                        }`}
                      >
                        <span className="truncate">{src}</span>
                        {count !== undefined && count > 0 && (
                          <span className="text-[10px] opacity-60 ml-2">[{count}]</span>
                        )}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
};
