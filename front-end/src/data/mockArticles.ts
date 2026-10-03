import { Article } from '../types';

// Runtime intelligence feed is dynamically fetched from the FastAPI backend SQLite database.
export const INITIAL_ARTICLES: Article[] = [];

export const ALL_SOURCES: string[] = [
  "All Sources",
  "DeepMind Research",
  "OpenAI Research",
  "Anthropic Policy Dispatch",
  "arXiv:2609.14820",
  "Stanford AI Lab",
  "Hugging Face Hub",
  "MIT Technology Review",
  "Nature Machine Intelligence",
  "TechCrunch",
  "Financial Times Tech",
  "European AI Office"
];

export const NEWS_TYPES: { label: string; desc: string }[] = [
  { label: "All", desc: "Complete intelligence feed" },
  { label: "Breakthroughs", desc: "Fundamental science & novel architectures" },
  { label: "Product & Releases", desc: "Frontier APIs & commercial systems" },
  { label: "Open Source", desc: "Weights, datasets & open tooling" },
  { label: "Policy & Safety", desc: "Governance, standards & red-teaming" },
  { label: "Hardware & Compute", desc: "Silicon, clusters & energy systems" }
];

export const CATEGORIES: { label: string; count?: number }[] = [
  { label: "All" },
  { label: "LLMs & Reasoning" },
  { label: "Vision & Multimodal" },
  { label: "Autonomous Agents" },
  { label: "Robotics & Embodiment" },
  { label: "AI Chips & Silicon" },
  { label: "Neuro-Symbolic" }
];
