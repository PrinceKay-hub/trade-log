"use client";

import { useEffect, useState } from "react";
import { getAllTrades, computeStats } from "@/lib/trades";
import { Trade, TradeStats } from "@/types/trade";
import StatCard from "@/components/StatCard";
import OutcomeBadge from "@/components/OutcomeBadge";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { TrendingUp, TrendingDown, Plus, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getAllTrades(user.uid).then((data) => {
      setTrades(data);
      setStats(computeStats(data));
      setLoading(false);
    });
  }, [user]);

  const equityData = trades
    .filter((t) => t.outcome !== "OPEN" && t.pnl !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce<{ date: string; equity: number }[]>((acc, t) => {
      const prev = acc[acc.length - 1]?.equity ?? 0;
      acc.push({ date: format(new Date(t.date), "MMM d"), equity: Math.round((prev + (t.pnl ?? 0)) * 100) / 100 });
      return acc;
    }, []);

  const recentTrades = trades.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-[#444] text-sm animate-pulse">Loading journal…</div>
      </div>
    );
  }

  const isEmpty = trades.length === 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-[#555] mt-0.5">{format(new Date(), "EEEE, MMMM d yyyy")}</p>
        </div>
        <Link href="/trades/new"
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-semibold rounded-lg transition-all">
          <Plus size={15} /> <span className="hidden sm:inline">Log Trade</span><span className="sm:hidden">New</span>
        </Link>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center mb-4">
            <TrendingUp size={28} className="text-[#444]" />
          </div>
          <h2 className="text-lg font-semibold text-[#888] mb-2">No trades yet</h2>
          <p className="text-sm text-[#555] mb-6 max-w-xs">Start logging your trades to track your performance, strategy, and growth over time.</p>
          <Link href="/trades/new"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg transition-all">
            Log your first trade
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <StatCard label="Win Rate" value={`${stats!.winRate.toFixed(1)}%`}
              color={stats!.winRate >= 50 ? "green" : "red"}
              sub={`${stats!.wins}W · ${stats!.losses}L · ${stats!.breakevens}BE`}
              icon={<TrendingUp size={16} />} large />
            <StatCard label="Total P&L" value={`$${stats!.totalPnl.toFixed(2)}`}
              color={stats!.totalPnl >= 0 ? "green" : "red"}
              sub={`${stats!.totalTrades} trades`} />
            <StatCard label="Avg R:R" value={`1:${stats!.avgRR.toFixed(2)}`} color="yellow" sub="Risk to reward" />
            <StatCard label="Profit Factor"
              value={stats!.profitFactor === Infinity ? "∞" : stats!.profitFactor.toFixed(2)}
              color="blue" sub="Gross profit / loss" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard label="Best Trade" value={`$${stats!.bestTrade.toFixed(2)}`} color="green" />
            <StatCard label="Worst Trade" value={`$${stats!.worstTrade.toFixed(2)}`} color="red" />
            <StatCard label="Avg Win" value={`$${stats!.avgWin.toFixed(2)}`} color="green" />
            <StatCard label="Open" value={stats!.openTrades} color="blue" />
          </div>

          {/* Equity Curve */}
          {equityData.length > 1 && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sm:p-6 mb-6">
              <h2 className="text-xs font-semibold text-[#888] uppercase tracking-widest mb-5">Equity Curve</h2>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={equityData}>
                  <defs>
                    <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={45} />
                  <Tooltip
                    contentStyle={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#888" }}
                    itemStyle={{ color: "#f59e0b" }}
                    formatter={(v: unknown) => [`$${v as number}`, "Equity"]}
                  />
                  <Area type="monotone" dataKey="equity" stroke="#f59e0b" strokeWidth={2} fill="url(#eq)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Trades */}
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#1f1f1f]">
              <h2 className="text-xs font-semibold text-[#888] uppercase tracking-widest">Recent Trades</h2>
              <Link href="/trades" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-[#1a1a1a]">
              {recentTrades.map((trade) => (
                <Link key={trade.id} href={`/trades/${trade.id}`}
                  className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-[#181818] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-7 rounded-full ${trade.direction === "BUY" ? "bg-emerald-500" : "bg-red-500"}`} />
                    <div>
                      <p className="text-sm font-semibold text-white">{trade.pair}</p>
                      <p className="text-xs text-[#555] hidden sm:block">{trade.strategy} · {trade.session}</p>
                      <p className="text-xs text-[#555] sm:hidden">{trade.session}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-6">
                    <span className="text-xs text-[#555] hidden sm:block">{format(new Date(trade.date), "MMM d")}</span>
                    <span className={`text-sm font-semibold tabular-nums ${(trade.pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {trade.pnl !== null ? `${(trade.pnl ?? 0) >= 0 ? "+" : ""}$${trade.pnl?.toFixed(2)}` : "—"}
                    </span>
                    <OutcomeBadge outcome={trade.outcome} />
                    {(trade.pnl ?? 0) >= 0
                      ? <TrendingUp size={14} className="text-emerald-400 hidden sm:block" />
                      : <TrendingDown size={14} className="text-red-400 hidden sm:block" />}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
