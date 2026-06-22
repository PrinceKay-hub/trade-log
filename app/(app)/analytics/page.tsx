"use client";

import { useEffect, useState } from "react";
import { getAllTrades, computeStats } from "@/lib/trades";
import { Trade, TradeStats } from "@/types/trade";
import StatCard from "@/components/StatCard";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from "recharts";

const COLORS = { WIN: "#10b981", LOSS: "#ef4444", BREAKEVEN: "#f59e0b", OPEN: "#38bdf8" };

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getAllTrades(user.uid).then(data => {
      setTrades(data);
      setStats(computeStats(data));
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="p-6 text-[#444] animate-pulse">Loading analytics…</div>;
  if (!stats || trades.length === 0) return (
    <div className="p-6 text-center py-32">
      <p className="text-[#555]">No trade data yet. Log some trades to see analytics.</p>
    </div>
  );

  const outcomeDist = [
    { name: "Wins", value: stats.wins, color: COLORS.WIN },
    { name: "Losses", value: stats.losses, color: COLORS.LOSS },
    { name: "Breakeven", value: stats.breakevens, color: COLORS.BREAKEVEN },
    { name: "Open", value: stats.openTrades, color: COLORS.OPEN },
  ].filter(d => d.value > 0);

  const pairPnl: Record<string, number> = {};
  trades.forEach(t => {
    if (t.pnl !== null && t.outcome !== "OPEN") {
      pairPnl[t.pair] = (pairPnl[t.pair] || 0) + (t.pnl ?? 0);
    }
  });
  const pairData = Object.entries(pairPnl).map(([pair, pnl]) => ({ pair, pnl: Math.round(pnl * 100) / 100 })).sort((a, b) => b.pnl - a.pnl);

  const sessionPnl: Record<string, number> = {};
  trades.forEach(t => {
    if (t.pnl !== null && t.outcome !== "OPEN") {
      sessionPnl[t.session] = (sessionPnl[t.session] || 0) + (t.pnl ?? 0);
    }
  });
  const sessionData = Object.entries(sessionPnl).map(([session, pnl]) => ({ session, pnl: Math.round(pnl * 100) / 100 }));

  const emotionStats: Record<string, { wins: number; total: number }> = {};
  trades.filter(t => t.outcome !== "OPEN").forEach(t => {
    if (!emotionStats[t.emotion]) emotionStats[t.emotion] = { wins: 0, total: 0 };
    emotionStats[t.emotion].total++;
    if (t.outcome === "WIN") emotionStats[t.emotion].wins++;
  });
  const emotionData = Object.entries(emotionStats)
    .map(([emotion, s]) => ({ emotion, winRate: Math.round((s.wins / s.total) * 100) }))
    .sort((a, b) => b.winRate - a.winRate);

  // Confluence win rate per factor
  const confluenceStats: Record<string, { wins: number; total: number }> = {};
  trades.filter(t => t.outcome !== "OPEN").forEach(t => {
    const all = [...(t.confluences ?? []), ...(t.customConfluences ?? [])];
    all.forEach(c => {
      if (!confluenceStats[c]) confluenceStats[c] = { wins: 0, total: 0 };
      confluenceStats[c].total++;
      if (t.outcome === "WIN") confluenceStats[c].wins++;
    });
  });
  const confluenceData = Object.entries(confluenceStats)
    .filter(([, s]) => s.total >= 1)
    .map(([factor, s]) => ({
      factor: factor.length > 20 ? factor.slice(0, 20) + "…" : factor,
      winRate: Math.round((s.wins / s.total) * 100),
      total: s.total,
    }))
    .sort((a, b) => b.winRate - a.winRate);

  // Confluence score vs win rate
  const scoreMap: Record<number, { wins: number; total: number }> = {};
  trades.filter(t => t.outcome !== "OPEN").forEach(t => {
    const score = t.confluenceScore ?? 0;
    if (!scoreMap[score]) scoreMap[score] = { wins: 0, total: 0 };
    scoreMap[score].total++;
    if (t.outcome === "WIN") scoreMap[score].wins++;
  });
  const scoreData = Object.entries(scoreMap)
    .map(([score, s]) => ({
      score: `${score} factor${Number(score) !== 1 ? "s" : ""}`,
      winRate: Math.round((s.wins / s.total) * 100),
      total: s.total,
    }))
    .sort((a, b) => parseInt(a.score) - parseInt(b.score));

  const stratStats: Record<string, { wins: number; total: number; pnl: number }> = {};
  trades.filter(t => t.outcome !== "OPEN").forEach(t => {
    if (!stratStats[t.strategy]) stratStats[t.strategy] = { wins: 0, total: 0, pnl: 0 };
    stratStats[t.strategy].total++;
    if (t.outcome === "WIN") stratStats[t.strategy].wins++;
    stratStats[t.strategy].pnl += t.pnl ?? 0;
  });
  const stratData = Object.entries(stratStats).map(([strategy, s]) => ({
    strategy: strategy.length > 18 ? strategy.slice(0, 18) + "…" : strategy,
    winRate: Math.round((s.wins / s.total) * 100),
    trades: s.total,
    pnl: Math.round(s.pnl * 100) / 100,
  })).sort((a, b) => b.winRate - a.winRate);

  const tt = {
    contentStyle: { background: "#141414", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 },
    labelStyle: { color: "#888" }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-xs sm:text-sm text-[#555] mt-0.5">Patterns across {trades.length} trades</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color={stats.winRate >= 50 ? "green" : "red"} />
        <StatCard label="Profit Factor" value={stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)} color="blue" />
        <StatCard label="Avg R:R" value={`1:${stats.avgRR.toFixed(2)}`} color="yellow" />
        <StatCard label="Total P&L" value={`$${stats.totalPnl.toFixed(2)}`} color={stats.totalPnl >= 0 ? "green" : "red"} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sm:p-6">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Outcome Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={outcomeDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                {outcomeDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip {...tt} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#888" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sm:p-6">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">P&L by Session</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sessionData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey="session" tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={40} />
              <Tooltip {...tt} formatter={(v: unknown) => [`$${v as number}`, "P&L"]} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {sessionData.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {pairData.length > 0 && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sm:p-6">
            <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">P&L by Pair</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pairData} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="pair" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} width={55} />
                <Tooltip {...tt} formatter={(v: unknown) => [`$${v as number}`, "P&L"]} />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                  {pairData.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {emotionData.length > 0 && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sm:p-6">
            <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Win Rate by Emotion</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={emotionData} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <YAxis type="category" dataKey="emotion" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} width={60} />
                <Tooltip {...tt} formatter={(v: unknown) => [`${v as number}%`, "Win Rate"]} />
                <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                  {emotionData.map((entry, i) => <Cell key={i} fill={entry.winRate >= 50 ? "#a78bfa" : "#6d28d9"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Confluence Analytics */}
      {confluenceData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Win rate per confluence factor */}
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sm:p-6">
            <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Win Rate by Confluence Factor</h2>
            <ResponsiveContainer width="100%" height={Math.max(180, confluenceData.length * 28)}>
              <BarChart data={confluenceData} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <YAxis type="category" dataKey="factor" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} width={110} />
                <Tooltip {...tt} formatter={(v: unknown) => [`${v as number}%`, "Win Rate"]} />
                <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                  {confluenceData.map((entry, i) => (
                    <Cell key={i} fill={entry.winRate >= 60 ? "#f59e0b" : entry.winRate >= 50 ? "#10b981" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Confluence score vs win rate */}
          {scoreData.length > 1 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sm:p-6">
              <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-1">Confluence Score vs Win Rate</h2>
              <p className="text-[10px] text-[#444] mb-4">Does more confluence = higher win rate?</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="score" tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} width={35} />
                  <Tooltip {...tt} formatter={(v: unknown) => [`${v as number}%`, "Win Rate"]} />
                  <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                    {scoreData.map((entry, i) => (
                      <Cell key={i} fill={entry.winRate >= 60 ? "#f59e0b" : entry.winRate >= 50 ? "#10b981" : "#6b7280"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Confluence factor table */}
      {confluenceData.length > 0 && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden mb-4">
          <div className="px-4 sm:px-6 py-4 border-b border-[#1f1f1f]">
            <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest">Confluence Factor Breakdown</h2>
          </div>
          <div className="divide-y divide-[#1a1a1a]">
            {confluenceData.map(c => (
              <div key={c.factor} className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-[#181818] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm text-amber-300 font-medium truncate">{c.factor}</span>
                  <span className="text-xs text-[#555] shrink-0">{c.total} trade{c.total !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-20 h-1.5 bg-[#222] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${c.winRate}%`, background: c.winRate >= 60 ? "#f59e0b" : c.winRate >= 50 ? "#10b981" : "#ef4444" }} />
                  </div>
                  <span className={`text-xs font-bold w-8 text-right ${c.winRate >= 60 ? "text-amber-400" : c.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                    {c.winRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stratData.length > 0 && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-[#1f1f1f]">
            <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest">Strategy Performance</h2>
          </div>
          {/* Desktop table */}
          <table className="w-full text-sm hidden sm:table">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {["Strategy", "Trades", "Win Rate", "P&L"].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-[#555] uppercase tracking-widest px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {stratData.map(s => (
                <tr key={s.strategy} className="hover:bg-[#181818] transition-colors">
                  <td className="px-6 py-3 font-medium text-[#ccc]">{s.strategy}</td>
                  <td className="px-6 py-3 text-[#666]">{s.trades}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-[#222] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.winRate}%`, background: s.winRate >= 50 ? "#10b981" : "#ef4444" }} />
                      </div>
                      <span className={`text-xs font-semibold ${s.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>{s.winRate}%</span>
                    </div>
                  </td>
                  <td className={`px-6 py-3 font-semibold tabular-nums ${s.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {s.pnl >= 0 ? "+" : ""}${s.pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Mobile strategy cards */}
          <div className="sm:hidden divide-y divide-[#1a1a1a]">
            {stratData.map(s => (
              <div key={s.strategy} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#ccc] truncate">{s.strategy}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-16 h-1 bg-[#222] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.winRate}%`, background: s.winRate >= 50 ? "#10b981" : "#ef4444" }} />
                    </div>
                    <span className={`text-xs font-semibold ${s.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>{s.winRate}%</span>
                    <span className="text-xs text-[#555]">{s.trades} trades</span>
                  </div>
                </div>
                <span className={`text-sm font-semibold tabular-nums ml-3 shrink-0 ${s.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {s.pnl >= 0 ? "+" : ""}${s.pnl.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
