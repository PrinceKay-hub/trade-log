"use client";

import { useEffect, useState } from "react";
import { getAllTrades, deleteTrade } from "@/lib/trades";
import { Trade } from "@/types/trade";
import OutcomeBadge from "@/components/OutcomeBadge";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Plus, Trash2, Eye, Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { format } from "date-fns";

export default function TradesPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("ALL");
  const [filterPair, setFilterPair] = useState("ALL");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const load = async () => {
    if (!user) return;
    const data = await getAllTrades(user.uid);
    setTrades(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const pairs = ["ALL", ...Array.from(new Set(trades.map(t => t.pair)))];
  const outcomes = ["ALL", "WIN", "LOSS", "BREAKEVEN", "OPEN"];

  const filtered = trades.filter(t => {
    const matchSearch = search === "" || t.pair.toLowerCase().includes(search.toLowerCase()) || t.strategy.toLowerCase().includes(search.toLowerCase());
    const matchOutcome = filterOutcome === "ALL" || t.outcome === filterOutcome;
    const matchPair = filterPair === "ALL" || t.pair === filterPair;
    return matchSearch && matchOutcome && matchPair;
  });

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Delete this trade?")) return;
    setDeleting(id);
    await deleteTrade(user.uid, id);
    await load();
    setDeleting(null);
  };

  const inputCls = "bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/60 transition-colors";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Trade Log</h1>
          <p className="text-xs sm:text-sm text-[#555] mt-0.5">{trades.length} trades recorded</p>
        </div>
        <Link href="/trades/new"
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-semibold rounded-lg transition-all">
          <Plus size={15} /> <span className="hidden sm:inline">New Trade</span><span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 sm:flex-none">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search pair or strategy…" className={`${inputCls} pl-8 w-full sm:w-56`} />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${showFilters ? "border-amber-500/40 text-amber-400 bg-amber-500/5" : "border-[#2a2a2a] text-[#666] hover:border-[#3a3a3a] hover:text-white"}`}>
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">Filter</span>
          <ChevronDown size={12} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
        <span className="ml-auto text-xs text-[#555] self-center shrink-0">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-[#0e0e0e] border border-[#2a2a2a] rounded-xl">
          <select value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)} className={inputCls}>
            {outcomes.map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={filterPair} onChange={e => setFilterPair(e.target.value)} className={inputCls}>
            {pairs.map(p => <option key={p}>{p}</option>)}
          </select>
          {(filterOutcome !== "ALL" || filterPair !== "ALL") && (
            <button onClick={() => { setFilterOutcome("ALL"); setFilterPair("ALL"); }}
              className="text-xs text-amber-400 hover:text-amber-300 px-2">Clear filters</button>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-[#444] text-sm animate-pulse py-20 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#555] text-sm">No trades match your filters.</p>
          {trades.length === 0 && (
            <Link href="/trades/new" className="text-amber-400 text-sm hover:underline mt-2 inline-block">Log your first trade →</Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f1f1f]">
                  {["Date", "Pair", "Dir", "Strategy", "Entry", "Exit", "SL", "TP", "R:R", "P&L", "Confluence", "Session", "Emotion", "Outcome", ""].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold text-[#555] uppercase tracking-widest px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {filtered.map(trade => (
                  <tr key={trade.id} className="hover:bg-[#181818] transition-colors group">
                    <td className="px-4 py-3 text-[#777] whitespace-nowrap">{format(new Date(trade.date), "MMM d, yy")}</td>
                    <td className="px-4 py-3 font-semibold text-white">{trade.pair}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${trade.direction === "BUY" ? "text-emerald-400" : "text-red-400"}`}>{trade.direction}</span>
                    </td>
                    <td className="px-4 py-3 text-[#888] max-w-[120px] truncate">{trade.strategy}</td>
                    <td className="px-4 py-3 tabular-nums text-[#aaa]">{trade.entryPrice}</td>
                    <td className="px-4 py-3 tabular-nums text-[#aaa]">{trade.exitPrice ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-red-400/70">{trade.stopLoss}</td>
                    <td className="px-4 py-3 tabular-nums text-emerald-400/70">{trade.takeProfit}</td>
                    <td className="px-4 py-3 tabular-nums text-amber-400">{trade.riskReward ? `1:${trade.riskReward}` : "—"}</td>
                    <td className={`px-4 py-3 tabular-nums font-semibold ${(trade.pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {trade.pnl !== null ? `${(trade.pnl ?? 0) >= 0 ? "+" : ""}$${trade.pnl?.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {(trade.confluenceScore ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          ✓ {trade.confluenceScore}
                        </span>
                      ) : <span className="text-[#444]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[#666]">{trade.session}</td>
                    <td className="px-4 py-3 text-[#666]">{trade.emotion}</td>
                    <td className="px-4 py-3"><OutcomeBadge outcome={trade.outcome} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/trades/${trade.id}`} className="p-1.5 rounded-md hover:bg-[#252525] text-[#555] hover:text-white transition-all">
                          <Eye size={13} />
                        </Link>
                        <button onClick={() => handleDelete(trade.id!)} disabled={deleting === trade.id}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-[#555] hover:text-red-400 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map(trade => (
              <div key={trade.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-10 rounded-full ${trade.direction === "BUY" ? "bg-emerald-500" : "bg-red-500"}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{trade.pair}</span>
                        <span className={`text-xs font-bold ${trade.direction === "BUY" ? "text-emerald-400" : "text-red-400"}`}>{trade.direction}</span>
                      </div>
                      <p className="text-xs text-[#555] mt-0.5">{trade.strategy}</p>
                    </div>
                  </div>
                  <OutcomeBadge outcome={trade.outcome} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div>
                    <p className="text-[#555] mb-0.5">Date</p>
                    <p className="text-[#aaa]">{format(new Date(trade.date), "MMM d")}</p>
                  </div>
                  <div>
                    <p className="text-[#555] mb-0.5">R:R</p>
                    <p className="text-amber-400">{trade.riskReward ? `1:${trade.riskReward}` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[#555] mb-0.5">P&L</p>
                    <p className={`font-semibold ${(trade.pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {trade.pnl !== null ? `${(trade.pnl ?? 0) >= 0 ? "+" : ""}$${trade.pnl?.toFixed(2)}` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#555] mb-0.5">Entry</p>
                    <p className="text-[#aaa]">{trade.entryPrice}</p>
                  </div>
                  <div>
                    <p className="text-[#555] mb-0.5">Confluence</p>
                    <p className="text-amber-300">{(trade.confluenceScore ?? 0) > 0 ? `✓ ${trade.confluenceScore} factor${trade.confluenceScore !== 1 ? "s" : ""}` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[#555] mb-0.5">Session</p>
                    <p className="text-[#aaa]">{trade.session}</p>
                  </div>
                  <div>
                    <p className="text-[#555] mb-0.5">Emotion</p>
                    <p className="text-purple-300">{trade.emotion}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-[#1a1a1a]">
                  <Link href={`/trades/${trade.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-[#2a2a2a] text-xs text-[#666] hover:text-white hover:border-[#3a3a3a] transition-all">
                    <Eye size={12} /> View
                  </Link>
                  <button onClick={() => handleDelete(trade.id!)} disabled={deleting === trade.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-500/20 text-xs text-red-500/60 hover:text-red-400 hover:border-red-500/40 transition-all">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
