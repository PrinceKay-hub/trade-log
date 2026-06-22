"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllTrades } from "@/lib/trades";
import { useAuth } from "@/context/AuthContext";
import { Trade } from "@/types/trade";
import {
  format, startOfYear, eachDayOfInterval, endOfYear,
  getDay, getWeek, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval,
} from "date-fns";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pnlColor(pnl: number | null, hasTrade: boolean): string {
  if (!hasTrade) return "bg-[#141414] border-[#1f1f1f]";
  if (pnl === null) return "bg-[#1f2937] border-[#374151]"; // open trade (no pnl)
  if (pnl > 50)  return "bg-emerald-500 border-emerald-400";
  if (pnl > 0)   return "bg-emerald-700 border-emerald-600";
  if (pnl === 0) return "bg-amber-600 border-amber-500";
  if (pnl > -50) return "bg-red-700 border-red-600";
  return "bg-red-500 border-red-400";
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [tooltip, setTooltip] = useState<{ date: string; pnl: number | null; count: number; wins: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    getAllTrades(user.uid).then(data => { setTrades(data); setLoading(false); });
  }, [user]);

  // Map date string → { pnl, count, wins }
  const dayMap = useMemo(() => {
    const map: Record<string, { pnl: number; count: number; wins: number; hasNull: boolean }> = {};
    trades.forEach(t => {
      const d = t.date.slice(0, 10);
      if (!map[d]) map[d] = { pnl: 0, count: 0, wins: 0, hasNull: false };
      map[d].count++;
      if (t.pnl === null || t.pnl === undefined) { map[d].hasNull = true; }
      else map[d].pnl += t.pnl;
      if (t.outcome === "WIN") map[d].wins++;
    });
    return map;
  }, [trades]);

  // Build weeks grid for the year
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));
  const days = eachDayOfInterval({ start: yearStart, end: yearEnd });

  // Group into weeks (columns)
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = Array(getDay(yearStart)).fill(null);
  days.forEach(d => {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  });
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }

  // Month labels positioning
  const monthLabels = MONTHS.map((m, i) => {
    const firstDay = startOfMonth(new Date(year, i, 1));
    const weekIdx = Math.floor((days.indexOf(days.find(d => format(d, "yyyy-MM-dd") === format(firstDay, "yyyy-MM-dd"))!) ) / 7);
    return { label: m, weekIdx };
  });

  // Day-of-week stats
  const dowStats = DAYS.map((label, dow) => {
    const ts = trades.filter(t => getDay(parseISO(t.date)) === dow && t.pnl !== null);
    const pnl = ts.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const wins = ts.filter(t => t.outcome === "WIN").length;
    return { label, pnl: Math.round(pnl * 100) / 100, trades: ts.length, winRate: ts.length ? Math.round((wins / ts.length) * 100) : 0 };
  });

  // Monthly stats
  const monthStats = eachMonthOfInterval({ start: yearStart, end: yearEnd }).map(m => {
    const label = format(m, "MMM");
    const ts = trades.filter(t => t.date.startsWith(format(m, "yyyy-MM")) && t.pnl !== null);
    const pnl = ts.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const wins = ts.filter(t => t.outcome === "WIN").length;
    return { label, pnl: Math.round(pnl * 100) / 100, trades: ts.length, winRate: ts.length ? Math.round((wins / ts.length) * 100) : 0 };
  });

  const totalPnl = Object.values(dayMap).reduce((s, d) => s + d.pnl, 0);
  const tradingDays = Object.keys(dayMap).filter(d => d.startsWith(String(year))).length;

  if (loading) return <div className="p-8 text-[#444] animate-pulse">Loading calendar…</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Calendar</h1>
          <p className="text-xs sm:text-sm text-[#555] mt-0.5">{tradingDays} trading days · ${totalPnl.toFixed(2)} total P&L</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y - 1)}
            className="px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-sm text-[#666] hover:text-white hover:border-[#3a3a3a] transition-all">
            ←
          </button>
          <span className="text-sm font-semibold text-white px-2">{year}</span>
          <button onClick={() => setYear(y => y + 1)}
            disabled={year >= new Date().getFullYear()}
            className="px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-sm text-[#666] hover:text-white hover:border-[#3a3a3a] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            →
          </button>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sm:p-6 mb-6 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {weeks.map((_, wi) => {
              const ml = monthLabels.find(m => m.weekIdx === wi);
              return (
                <div key={wi} className="w-4 mr-0.5 text-[10px] text-[#555] shrink-0">
                  {ml ? ml.label : ""}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {DAYS.map((d, i) => (
                <div key={d} className={`h-4 w-6 text-[9px] text-[#555] flex items-center ${i % 2 === 0 ? "" : ""}`}>
                  {i % 2 === 1 ? d.slice(0, 3) : ""}
                </div>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="w-4 h-4" />;
                  const dateStr = format(day, "yyyy-MM-dd");
                  const data = dayMap[dateStr];
                  const hasTrade = !!data;
                  const pnl = data ? (data.hasNull && data.pnl === 0 ? null : data.pnl) : null;
                  return (
                    <div
                      key={di}
                      className={`w-4 h-4 rounded-sm border cursor-pointer transition-all hover:scale-125 hover:z-10 relative ${pnlColor(pnl, hasTrade)}`}
                      onMouseEnter={() => hasTrade && setTooltip({ date: dateStr, pnl, count: data.count, wins: data.wins })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="text-[10px] text-[#555]">Less</span>
            {[null, -100, -10, 0, 10, 100].map((v, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm border ${pnlColor(v, v !== null || i === 1)}`} />
            ))}
            <span className="text-[10px] text-[#555]">More profit</span>
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div className="mt-3 inline-flex items-center gap-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs">
            <span className="text-[#888]">{format(parseISO(tooltip.date), "MMMM d, yyyy")}</span>
            <span className="text-white font-semibold">{tooltip.count} trade{tooltip.count !== 1 ? "s" : ""}</span>
            <span className={tooltip.pnl === null ? "text-sky-400" : (tooltip.pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}>
              {tooltip.pnl === null ? "Open" : `${(tooltip.pnl ?? 0) >= 0 ? "+" : ""}$${tooltip.pnl?.toFixed(2)}`}
            </span>
            <span className="text-[#666]">{tooltip.wins}W / {tooltip.count - tooltip.wins}L</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Day of week */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sm:p-6">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Performance by Day of Week</h2>
          <div className="space-y-2.5">
            {dowStats.filter(d => d.trades > 0).sort((a, b) => b.pnl - a.pnl).map(d => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="text-xs text-[#666] w-8 shrink-0">{d.label}</span>
                <div className="flex-1 h-5 bg-[#1a1a1a] rounded overflow-hidden relative">
                  <div className={`h-full rounded transition-all ${d.pnl >= 0 ? "bg-emerald-500/30" : "bg-red-500/30"}`}
                    style={{ width: `${Math.min(Math.abs(d.pnl) / Math.max(...dowStats.map(x => Math.abs(x.pnl))) * 100, 100)}%` }} />
                  <span className="absolute inset-0 flex items-center px-2 text-[10px] text-[#888]">
                    {d.trades} trades · {d.winRate}% WR
                  </span>
                </div>
                <span className={`text-xs font-semibold w-16 text-right tabular-nums shrink-0 ${d.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {d.pnl >= 0 ? "+" : ""}${d.pnl.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sm:p-6">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Monthly Breakdown — {year}</h2>
          <div className="space-y-2">
            {monthStats.filter(m => m.trades > 0).map(m => (
              <div key={m.label} className="flex items-center gap-3">
                <span className="text-xs text-[#666] w-8 shrink-0">{m.label}</span>
                <div className="flex-1 h-5 bg-[#1a1a1a] rounded overflow-hidden relative">
                  <div className={`h-full rounded transition-all ${m.pnl >= 0 ? "bg-emerald-500/30" : "bg-red-500/30"}`}
                    style={{ width: `${Math.min(Math.abs(m.pnl) / Math.max(...monthStats.map(x => Math.abs(x.pnl))) * 100, 100)}%` }} />
                  <span className="absolute inset-0 flex items-center px-2 text-[10px] text-[#888]">
                    {m.trades} trades · {m.winRate}% WR
                  </span>
                </div>
                <span className={`text-xs font-semibold w-16 text-right tabular-nums shrink-0 ${m.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {m.pnl >= 0 ? "+" : ""}${m.pnl.toFixed(0)}
                </span>
              </div>
            ))}
            {monthStats.every(m => m.trades === 0) && (
              <p className="text-[#555] text-sm text-center py-8">No trades logged for {year} yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
