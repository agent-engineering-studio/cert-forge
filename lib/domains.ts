import type { BlockPlanItem, DomainCode } from './types';

export interface DomainInfo {
  code: DomainCode;
  name: string;
  /** Official share of scored content (per the exam guide). */
  weightPct: number;
  /** Number of questions this domain contributes to a 60-question full mock. */
  fullMockQuestions: number;
  blurb: string;
}

// Question counts follow the official exam-guide weighting (% of scored content),
// scaled to a 60-question full mock: 27/18/20/20/15 → 16/11/12/12/9 = 60.
export const DOMAINS: DomainInfo[] = [
  {
    code: 'D1',
    name: 'Agentic Architecture & Orchestration',
    weightPct: 27,
    fullMockQuestions: 16,
    blurb:
      'Designing agent loops, sub-agent delegation, control flow, and recovery. The heaviest-weighted domain.',
  },
  {
    code: 'D2',
    name: 'Tool Design & MCP Integration',
    weightPct: 18,
    fullMockQuestions: 11,
    blurb: 'Scoping tool schemas, choosing bash vs. dedicated tools, and wiring MCP servers safely.',
  },
  {
    code: 'D3',
    name: 'Claude Code Configuration & Workflows',
    weightPct: 20,
    fullMockQuestions: 12,
    blurb: 'Configuring Claude Code and composing dependable engineering workflows.',
  },
  {
    code: 'D4',
    name: 'Prompt Engineering & Structured Output',
    weightPct: 20,
    fullMockQuestions: 12,
    blurb: 'Prompt structure, salience, structured/JSON output, and prompt-cache-aware design.',
  },
  {
    code: 'D5',
    name: 'Context Management & Reliability',
    weightPct: 15,
    fullMockQuestions: 9,
    blurb: 'Compaction, context editing, caching, and keeping long-running systems reliable.',
  },
];

export const DOMAIN_MAP: Record<DomainCode, DomainInfo> = Object.fromEntries(
  DOMAINS.map((d) => [d.code, d]),
) as Record<DomainCode, DomainInfo>;

export const DOMAIN_CODES: DomainCode[] = DOMAINS.map((d) => d.code);

export const SINGLE_DOMAIN_QUESTIONS = 12;
export const FULL_MOCK_MINUTES = 120;

export function isDomainCode(v: unknown): v is DomainCode {
  return typeof v === 'string' && (DOMAIN_CODES as string[]).includes(v);
}

/**
 * Split a question count into block sizes, each between 3 and 5 (3 is the
 * exam's scenario-anchoring minimum). We favor SMALL blocks (3) on purpose:
 * each block is one live Claude generation the user waits on, so smaller blocks
 * mean the first question appears much sooner and later blocks prefetch while
 * answering. Never leaves a remainder below 3.
 */
export function splitCount(n: number): number[] {
  const parts: number[] = [];
  let rem = n;
  while (rem > 0) {
    if (rem <= 5) {
      parts.push(rem); // 3, 4, or 5 → a single final block
      break;
    }
    parts.push(3);
    rem -= 3;
  }
  return parts;
}

// One question per block: each is a tiny, fast generation the user waits on
// only briefly (with the timer paused), instead of one big multi-question block.
export function buildFullMockPlan(): BlockPlanItem[] {
  const plan: BlockPlanItem[] = [];
  for (const d of DOMAINS) {
    for (let i = 0; i < d.fullMockQuestions; i++) {
      plan.push({ domain: d.code, count: 1 });
    }
  }
  return plan;
}

export function buildSingleDomainPlan(domain: DomainCode): BlockPlanItem[] {
  return Array.from({ length: SINGLE_DOMAIN_QUESTIONS }, () => ({ domain, count: 1 }));
}
