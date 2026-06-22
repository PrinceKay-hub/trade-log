import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Trade, TradeStats } from "@/types/trade";

// Trades are stored under users/{uid}/trades for per-user isolation
const userTradesCol = (uid: string) => collection(db, "users", uid, "trades");
const userTradeDoc = (uid: string, id: string) => doc(db, "users", uid, "trades", id);

export async function addTrade(uid: string, trade: Omit<Trade, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(userTradesCol(uid), {
    ...trade,
    uid,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTrade(uid: string, id: string, trade: Partial<Trade>): Promise<void> {
  await updateDoc(userTradeDoc(uid, id), { ...trade, updatedAt: serverTimestamp() });
}

export async function deleteTrade(uid: string, id: string): Promise<void> {
  await deleteDoc(userTradeDoc(uid, id));
}

export async function getTrade(uid: string, id: string): Promise<Trade | null> {
  const snap = await getDoc(userTradeDoc(uid, id));
  if (!snap.exists()) return null;
  return firestoreToTrade(snap.id, snap.data());
}

export async function getAllTrades(uid: string): Promise<Trade[]> {
  const q = query(userTradesCol(uid), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => firestoreToTrade(d.id, d.data()));
}

function firestoreToTrade(id: string, data: Record<string, unknown>): Trade {
  return {
    id,
    ...data,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : (data.createdAt as string) || "",
    tags: Array.isArray(data.tags) ? data.tags : [],
  } as Trade;
}

export function computeStats(trades: Trade[]): TradeStats {
  const closed = trades.filter((t) => t.outcome !== "OPEN");
  const wins = closed.filter((t) => t.outcome === "WIN");
  const losses = closed.filter((t) => t.outcome === "LOSS");
  const breakevens = closed.filter((t) => t.outcome === "BREAKEVEN");
  const open = trades.filter((t) => t.outcome === "OPEN");

  const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const grossProfit = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
  const rrValues = closed.filter((t) => t.riskReward).map((t) => t.riskReward as number);
  const avgRR = rrValues.length ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length : 0;
  const pnlValues = closed.map((t) => t.pnl ?? 0);

  return {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: breakevens.length,
    openTrades: open.length,
    winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
    totalPnl,
    avgRR,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    bestTrade: pnlValues.length ? Math.max(...pnlValues) : 0,
    worstTrade: pnlValues.length ? Math.min(...pnlValues) : 0,
    avgWin: wins.length ? grossProfit / wins.length : 0,
    avgLoss: losses.length ? -grossLoss / losses.length : 0,
  };
}
