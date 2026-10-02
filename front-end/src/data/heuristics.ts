import { ArticleCategory, NewsType } from '../types';

interface HeuristicKeywords<T> {
  type: T;
  keywords: string[];
  weight?: number;
}

const CATEGORY_HEURISTICS: HeuristicKeywords<Exclude<ArticleCategory, 'All'>>[] = [
  {
    type: 'AI Chips & Silicon',
    keywords: [
      'chip', 'chips', 'silicon', 'tpu', 'gpu', 'gpus', 'wafer', 'semiconductor',
      'semiconductors', 'photonic', 'interconnect', 'transistor', 'hbm', 'hbm3e',
      'vram', 'cuda', 'tensor core', 'sram', 'asic', 'fpga', 'packaged die', 'lithography'
    ]
  },
  {
    type: 'Robotics & Embodiment',
    keywords: [
      'robot', 'robots', 'robotics', 'humanoid', 'embodied', 'manipulation',
      'quadruped', 'actuator', 'locomotion', 'dexterous', 'bipedal', 'gripper',
      'end-effector', 'kinematics', 'sim-to-real', 'tactile sensor'
    ]
  },
  {
    type: 'Vision & Multimodal',
    keywords: [
      'vision', 'multimodal', 'diffusion', 'image', 'images', 'video', 'videos',
      'speech', 'audio', 'vlm', 'generative video', 'optical', 'visual', 'sound',
      'voice', 'rendering', 'pixel', 'scene reconstruction', 'nerf', 'gaussian splatting'
    ]
  },
  {
    type: 'Autonomous Agents',
    keywords: [
      'agent', 'agents', 'autonomous', 'tool-use', 'computer-use', 'browser agent',
      'workflow', 'multi-agent', 'swarm', 'orchestration', 'action model', 'sub-agent',
      'self-directed', 'agentic'
    ]
  },
  {
    type: 'Neuro-Symbolic',
    keywords: [
      'neuro-symbolic', 'knowledge graph', 'formal logic', 'theorem prover',
      'proof obligation', 'symbolic reasoning', 'ontology', 'deductive', 'sat solver',
      'smt solver', 'formal verification', 'logic gate'
    ]
  },
  {
    type: 'LLMs & Reasoning',
    keywords: [
      'llm', 'llms', 'reasoning', 'transformer', 'transformers', 'prompt', 'prompts',
      'token', 'tokens', 'context window', 'attention', 'quantization', 'inference',
      'rlhf', 'chain of thought', 'cot', 'benchmark', 'fine-tuning', 'embedding',
      'language model', 'mixture-of-depth', 'distillation', 'mmlu', 'gsm8k'
    ]
  }
];

const TYPE_HEURISTICS: HeuristicKeywords<Exclude<NewsType, 'All'>>[] = [
  {
    type: 'Product & Releases',
    keywords: [
      'release', 'releases', 'launch', 'launches', 'announces', 'introduced',
      'available now', 'preview', 'pricing', 'feature', 'version', 'commercial',
      'api rollout', 'ga release', 'enterprise edition', 'rollout'
    ]
  },
  {
    type: 'Open Source',
    keywords: [
      'open source', 'open-source', 'open weights', 'open-weights', 'weights published',
      'github', 'apache 2.0', 'mit license', 'hugging face', 'weights available',
      'permissive license', 'checkpoint release', 'public repository'
    ]
  },
  {
    type: 'Policy & Safety',
    keywords: [
      'policy', 'safety', 'regulation', 'regulations', 'governance', 'copyright',
      'eu ai act', 'white house', 'ftc', 'red team', 'alignment', 'jailbreak',
      'bias', 'compliance', 'guardrails', 'national security', 'export control'
    ]
  },
  {
    type: 'Hardware & Compute',
    keywords: [
      'datacenter', 'data center', 'datacenters', 'cooling', 'liquid cooling',
      'power grid', 'megawatt', 'gigawatt', 'flop', 'flops', 'supercomputer',
      'infrastructure', 'energy consumption', 'rack-scale', 'cluster'
    ]
  },
  {
    type: 'Breakthroughs',
    keywords: [
      'breakthrough', 'breakthroughs', 'proves', 'novel', 'architecture',
      'outperforms', 'state of the art', 'sota', 'slashed', 'discovery',
      'paradigms', 'paper', 'researchers demonstrated', 'solves', 'foundational'
    ]
  }
];

/**
 * Automatically infers the category of an article using keyword heuristics.
 * Used as a fallback when an incoming wire / API / JSON payload lacks a category.
 */
export function inferCategoryFallback(
  headline: string,
  summary: string = '',
  sources: string[] = []
): Exclude<ArticleCategory, 'All'> {
  const text = `${headline} ${summary} ${sources.join(' ')}`.toLowerCase();

  let bestMatch: Exclude<ArticleCategory, 'All'> = 'LLMs & Reasoning';
  let highestScore = 0;

  for (const entry of CATEGORY_HEURISTICS) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (text.includes(kw)) {
        // Boost matches found in headline
        if (headline.toLowerCase().includes(kw)) {
          score += 3;
        } else {
          score += 1;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry.type;
    }
  }

  return bestMatch;
}

/**
 * Automatically infers the news type of an article using keyword heuristics.
 * Used as a fallback when an incoming wire / API / JSON payload lacks a type.
 */
export function inferNewsTypeFallback(
  headline: string,
  summary: string = '',
  sources: string[] = []
): Exclude<NewsType, 'All'> {
  const text = `${headline} ${summary} ${sources.join(' ')}`.toLowerCase();

  let bestMatch: Exclude<NewsType, 'All'> = 'Breakthroughs';
  let highestScore = 0;

  for (const entry of TYPE_HEURISTICS) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (text.includes(kw)) {
        // Boost matches found in headline
        if (headline.toLowerCase().includes(kw)) {
          score += 3;
        } else {
          score += 1;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry.type;
    }
  }

  return bestMatch;
}

/**
 * Normalizes raw news_type strings from SQLite/FastAPI (e.g. "PRODUCT & RELEASES")
 * into canonical frontend NewsType enums.
 */
export function normalizeNewsType(raw?: string | null): Exclude<NewsType, 'All'> {
  if (!raw) return 'Breakthroughs';
  const clean = raw.trim().toUpperCase().replace(/_/g, ' ');

  if (clean.includes('PRODUCT') || clean.includes('RELEASE') || clean.includes('LAUNCH')) {
    return 'Product & Releases';
  }
  if (clean.includes('OPEN SOURCE') || clean.includes('OPEN-SOURCE') || clean.includes('WEIGHT')) {
    return 'Open Source';
  }
  if (clean.includes('POLICY') || clean.includes('SAFETY') || clean.includes('GOVERN') || clean.includes('REGULAT')) {
    return 'Policy & Safety';
  }
  if (clean.includes('HARDWARE') || clean.includes('COMPUTE') || clean.includes('CHIP') || clean.includes('SILICON') || clean.includes('CLUSTER')) {
    return 'Hardware & Compute';
  }
  if (clean.includes('BREAKTHROUGH') || clean.includes('RESEARCH') || clean.includes('DISCOVERY') || clean.includes('PAPER')) {
    return 'Breakthroughs';
  }

  const map: Record<string, Exclude<NewsType, 'All'>> = {
    'BREAKTHROUGHS': 'Breakthroughs',
    'BREAKTHROUGH': 'Breakthroughs',
    'PRODUCT & RELEASES': 'Product & Releases',
    'PRODUCT AND RELEASES': 'Product & Releases',
    'OPEN SOURCE': 'Open Source',
    'POLICY & SAFETY': 'Policy & Safety',
    'POLICY AND SAFETY': 'Policy & Safety',
    'HARDWARE & COMPUTE': 'Hardware & Compute',
    'HARDWARE AND COMPUTE': 'Hardware & Compute'
  };

  return map[clean] || 'Breakthroughs';
}

/**
 * Normalizes raw category strings from SQLite/FastAPI (e.g. "LLMS & REASONING", "LLMS")
 * into canonical frontend ArticleCategory enums.
 */
export function normalizeCategory(raw?: string | null): Exclude<ArticleCategory, 'All'> {
  if (!raw) return 'LLMs & Reasoning';
  const clean = raw.trim().toUpperCase().replace(/_/g, ' ');

  if (clean.includes('CHIP') || clean.includes('SILICON') || clean.includes('SEMICONDUCTOR')) {
    return 'AI Chips & Silicon';
  }
  if (clean.includes('ROBOT') || clean.includes('EMBODIMENT') || clean.includes('EMBODIED')) {
    return 'Robotics & Embodiment';
  }
  if (clean.includes('VISION') || clean.includes('MULTIMODAL') || clean.includes('IMAGE') || clean.includes('VIDEO')) {
    return 'Vision & Multimodal';
  }
  if (clean.includes('AGENT') || clean.includes('AUTONOMOUS') || clean.includes('TOOL-USE')) {
    return 'Autonomous Agents';
  }
  if (clean.includes('NEURO-SYMBOLIC') || clean.includes('SYMBOLIC') || clean.includes('LOGIC') || clean.includes('PROVER')) {
    return 'Neuro-Symbolic';
  }
  if (clean.includes('LLM') || clean.includes('REASONING') || clean.includes('LANGUAGE') || clean.includes('TRANSFORMER')) {
    return 'LLMs & Reasoning';
  }

  const map: Record<string, Exclude<ArticleCategory, 'All'>> = {
    'LLMS & REASONING': 'LLMs & Reasoning',
    'LLMS AND REASONING': 'LLMs & Reasoning',
    'LLMS': 'LLMs & Reasoning',
    'LLM': 'LLMs & Reasoning',
    'VISION & MULTIMODAL': 'Vision & Multimodal',
    'VISION AND MULTIMODAL': 'Vision & Multimodal',
    'AUTONOMOUS AGENTS': 'Autonomous Agents',
    'ROBOTICS & EMBODIMENT': 'Robotics & Embodiment',
    'AI CHIPS & SILICON': 'AI Chips & Silicon',
    'NEURO-SYMBOLIC': 'Neuro-Symbolic'
  };

  return map[clean] || 'LLMs & Reasoning';
}
