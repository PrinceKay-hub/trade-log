"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSetup, deleteSetup } from "@/lib/journal";
import { getAllTrades } from "@/lib/trades";
import { useAuth } from "@/context/AuthContext";
import { PlaybookSetup, Trade } from "@/types/trade";
import Link from "next/link";
import OutcomeBadge from "@/components/OutcomeBadge";
import { ArrowLeft, Trash2, Clock, CalendarDays, TrendingUp, TrendingDown } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function SetupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [setup, setSetup] = useState<PlaybookSetup | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getSetup(user.uid, id), getAllTrades(user.uid)]).then(([s, t]) => {
      setSetup(s);
      setTrades(t);
      setLoading(false);
    });
  }, [id, user]);

  const handleDelete = async () => {
    if (!user || !confirm("Delete this setup?")) return;
    await deleteSetup(user.uid, id);
    router.push("/playbook");
  };

  if (loading) return <div className="p-8 text-[#444] animate-pulse">Loading…</div>;
  if (!setup) return <div className="p-8 text-[#555]">Setup not found.</div>;

  // Match linked trades by strategy name similarity
  const linkedTrades = trades.filter(t =>
    t.strategy.toLowerCase().includes(setup.name.toLowerCase()) ||
    setup.name.toLowerCase().includes(t.strategy.toLowerCase())
  );
  const closedTrades = linkedTrades.filter(t => t.outcome !== "OPEN");
  const wins = closedTrades.filter(t => t.outcome === "WIN").length;
  const winRate = closedTrades.length ? Math.round((wins / closedTrades.length) * 100) : null;
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const avgRR = closedTrades.filter(t => t.riskReward).length
    ? closedTrades.filter(t => t.riskReward).reduce((s, t) => s + (t.riskReward ?? 0), 0) / closedTrades.filter(t => t.riskReward).length
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Link href="/playbook" className="p-2 rounded-lg border border-[#2a2a2a] text-[#666] hover:text-white hover:border-[#3a3a3a] transition-all shrink-0 mt-0.5">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white">{setup.name}</h1>
          {setup.createdAt && (
            <p className="text-xs text-[#555] mt-1 flex items-center gap-1.5">
              <CalendarDays size={11} /> Added {format(parseISO(setup.createdAt), "MMMM d, yyyy")}
            </p>
          )}
        </div>
        <button onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/20 text-sm text-red-500/70 hover:text-red-400 hover:border-red-500/40 transition-all shrink-0">
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {/* Live Performance Stats */}
      {closedTrades.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 text-center">
            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Trades</p>
            <p className="text-xl font-bold text-white">{closedTrades.length}</p>
          </div>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 text-center">
            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Win Rate</p>
            <p className={`text-xl font-bold ${(winRate ?? 0) >= 50 ? "text-emerald-400" : "text-red-400"}`}>
              {winRate !== null ? `${winRate}%` : "—"}
            </p>
          </div>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 text-center">
            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">P&L</p>
            <div className={`flex items-center justify-center gap-1 text-xl font-bold ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalPnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              ${Math.abs(totalPnl).toFixed(2)}
            </div>
          </div>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 text-center">
            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Avg R:R</p>
            <p className="text-xl font-bold text-amber-400">{avgRR !== null ? `1:${avgRR.toFixed(2)}` : "—"}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Description */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Description</h2>
          <p className="text-sm text-[#888] leading-relaxed">{setup.description || <span className="text-[#444] italic">No description.</span>}</p>

          {/* Timeframes & Sessions */}
          <div className="mt-4 space-y-3">
            {setup.timeframes.length > 0 && (
              <div>
                <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Timeframes</p>
                <div className="flex flex-wrap gap-1.5">
                  {setup.timeframes.map(tf => (
                    <span key={tf} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">{tf}</span>
                  ))}
                </div>
              </div>
            )}
            {setup.sessions.length > 0 && (
              <div>
                <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Sessions</p>
                <div className="flex flex-wrap gap-1.5">
                  {setup.sessions.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {setup.tags.length > 0 && (
              <div>
                <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {setup.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#1f1f1f] border border-[#2a2a2a] text-[#888]">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rules */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Entry Rules</h2>
          {setup.rules.length === 0 ? (
            <p className="text-sm text-[#444] italic">No rules defined.</p>
          ) : (
            <ol className="space-y-3">
              {setup.rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-xs text-amber-400 font-bold mt-0.5 w-4 shrink-0">{i + 1}.</span>
                  <span className="text-sm text-[#ccc] leading-relaxed">{rule}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Screenshot */}
      {setup.screenshotUrl && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 mb-5">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Example Chart</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.screenshotUrl} alt="Setup example" className="w-full rounded-lg border border-[#2a2a2a] object-contain max-h-[500px]" />
        </div>
      )}

      {/* Linked trades */}
      {linkedTrades.length > 0 && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1f1f1f]">
            <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest">Linked Trades ({linkedTrades.length})</h2>
          </div>
          <div className="divide-y divide-[#1a1a1a]">
            {linkedTrades.slice(0, 10).map(trade => (
              <Link key={trade.id} href={`/trades/${trade.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-[#181818] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-6 rounded-full ${trade.direction === "BUY" ? "bg-emerald-500" : "bg-red-500"}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{trade.pair}</p>
                    <p className="text-xs text-[#555]">{format(parseISO(trade.date), "MMM d, yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {trade.riskReward && <span className="text-xs text-amber-400">1:{trade.riskReward}</span>}
                  {trade.pnl !== null && (
                    <span className={`text-sm font-semibold tabular-nums ${(trade.pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {(trade.pnl ?? 0) >= 0 ? "+" : ""}${trade.pnl?.toFixed(2)}
                    </span>
                  )}
                  <OutcomeBadge outcome={trade.outcome} />
                </div>
              </Link>
            ))}
          </div>
          {linkedTrades.length > 10 && (
            <div className="px-5 py-3 border-t border-[#1f1f1f]">
              <Link href="/trades" className="text-xs text-amber-400 hover:text-amber-300">
                View all {linkedTrades.length} trades →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
