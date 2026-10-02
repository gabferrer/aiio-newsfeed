export type NewsType = 
  | 'All'
  | 'Breakthroughs'
  | 'Product & Releases'
  | 'Open Source'
  | 'Policy & Safety'
  | 'Hardware & Compute';

export type ArticleCategory = 
  | 'All'
  | 'LLMs & Reasoning'
  | 'Vision & Multimodal'
  | 'Autonomous Agents'
  | 'Robotics & Embodiment'
  | 'AI Chips & Silicon'
  | 'Neuro-Symbolic';

export interface Citation {
  label: string;
  url: string;
}

export interface Article {
  id: number;
  headline: string;
  summary: string;
  url?: string;
  published_date?: string;
  sources: string[];
  type: Exclude<NewsType, 'All'>;
  category: Exclude<ArticleCategory, 'All'>;
  timestamp: string; // e.g. "12m ago", "1h ago"
  date: string; // "2026-09-30"
  readingTime: string;
  isTopFiveDaily?: boolean;
  impactScore?: number; // 1-10

  // New Editorial & Deep Dive Fields (from FastAPI backend)
  overview?: string;
  fullAnalysis?: string; // Mapped from backend 'analysis'
  keyTakeaways?: string[];
  primary_citations_repositories?: Citation[];
}

export interface FilterState {
  searchQuery: string;
  selectedType: NewsType;
  selectedCategory: ArticleCategory;
  selectedSource: string;
  onlyTopFive: boolean;
  bookmarkedOnly: boolean;
}
