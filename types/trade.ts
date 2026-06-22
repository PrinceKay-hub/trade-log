export type Direction = "BUY" | "SELL";
export type Outcome = "WIN" | "LOSS" | "BREAKEVEN" | "OPEN";
export type Session = "London" | "New York" | "Asia" | "Sydney" | "Overlap";
export type Emotion =
  | "Calm"
  | "Confident"
  | "Anxious"
  | "Greedy"
  | "Fearful"
  | "Revenge"
  | "FOMO"
  | "Neutral";

export const PRESET_CONFLUENCES = [
  "HTF Bias",
  "Trend",
  "BOS",
  "CHoCH",
  "MSS",
  "Order Block",
  "FVG",
  "Liquidity Sweep",
  "Premium / Discount",
  "Kill Zone",
  "VWAP",
  "Support / Resistance",
] as const;

export type PresetConfluence = typeof PRESET_CONFLUENCES[number];

export interface Trade {
  id?: string;
  createdAt?: string;
  date: string;
  pair: string;
  direction: Direction;
  session: Session;
  strategy: string;
  entryPrice: number;
  exitPrice?: number | null;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  riskReward?: number | null;
  outcome: Outcome;
  pnl?: number | null;
  emotion: Emotion;
  notes: string;
  screenshotUrl?: string | null;
  tags: string[];
  // Confluence
  confluences: string[];       // preset + custom combined
  customConfluences: string[]; // user-typed extras
  confluenceScore: number;     // total count
  // Trade Plan vs Execution
  tradePlan?: string;
  executionScore?: number | null; // 1-5
  executionNotes?: string;
}

export interface TradeStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  totalPnl: number;
  avgRR: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  avgLoss: number;
  openTrades: number;
}

// ── Risk Settings ──────────────────────────────────────────────
export interface RiskSettings {
  accountBalance: number;
  maxDailyLossPercent: number;
  maxRiskPerTradePercent: number;
  updatedAt?: string;
}

// ── Trade Review ───────────────────────────────────────────────
export interface TradeReview {
  id?: string;
  periodType: "weekly" | "monthly";
  periodLabel: string; // e.g. "2024-W03" or "2024-01"
  wentWell: string;
  wentWrong: string;
  lessonsLearned: string;
  nextWeekFocus: string;
  emotionRating: number; // 1-5
  disciplineRating: number; // 1-5
  createdAt?: string;
  updatedAt?: string;
}

// ── Playbook Setup ─────────────────────────────────────────────
export interface PlaybookSetup {
  id?: string;
  name: string;
  description: string;
  rules: string[];
  timeframes: string[];
  sessions: string[];
  tags: string[];
  screenshotUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
