"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTrade, deleteTrade } from "@/lib/trades";
import { useAuth } from "@/context/AuthContext";
import { Trade } from "@/types/trade";
import OutcomeBadge from "@/components/OutcomeBadge";
import Link from "next/link";
import { ArrowLeft, Edit2, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function TradeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getTrade(user.uid, id).then(t => { setTrade(t); setLoading(false); });
  }, [id, user]);

  const handleDelete = async () => {
    if (!user || !confirm("Delete this trade?")) return;
    await deleteTrade(user.uid, id);
    router.push("/trades");
  };

  if (loading) return <div className="p-6 text-[#444] animate-pulse">Loading…</div>;
  if (!trade) return <div className="p-6 text-[#555]">Trade not found.</div>;

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-start justify-between py-2.5 border-b border-[#1a1a1a] last:border-0">
      <span className="text-xs text-[#555] uppercase tracking-wider shrink-0 w-28">{label}</span>
      <span className="text-sm text-[#ccc] text-right">{value}</span>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Link href="/trades" className="p-2 rounded-lg border border-[#2a2a2a] text-[#666] hover:text-white hover:border-[#3a3a3a] transition-all shrink-0 mt-0.5">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white">{trade.pair}</h1>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${trade.direction === "BUY" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
              {trade.direction}
            </span>
            <OutcomeBadge outcome={trade.outcome} />
          </div>
          <p className="text-xs sm:text-sm text-[#555] flex items-center gap-1.5">
            <Calendar size={12} /> {format(new Date(trade.date), "EEEE, MMMM d yyyy")} · {trade.session}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-6">
        <Link href={`/trades/${id}/edit`}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#2a2a2a] text-sm text-[#666] hover:text-white hover:border-[#3a3a3a] transition-all">
          <Edit2 size={14} /> Edit
        </Link>
        <button onClick={handleDelete}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/20 text-sm text-red-500/70 hover:text-red-400 hover:border-red-500/40 transition-all">
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3 sm:p-4 text-center">
          <p className="text-[10px] sm:text-xs text-[#555] uppercase tracking-wider mb-1">P&L</p>
          <p className={`text-lg sm:text-2xl font-bold tabular-nums ${(trade.pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {trade.pnl !== null ? `${(trade.pnl ?? 0) >= 0 ? "+" : ""}$${trade.pnl?.toFixed(2)}` : "—"}
          </p>
        </div>
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3 sm:p-4 text-center">
          <p className="text-[10px] sm:text-xs text-[#555] uppercase tracking-wider mb-1">R:R</p>
          <p className="text-lg sm:text-2xl font-bold text-amber-400 tabular-nums">
            {trade.riskReward ? `1:${trade.riskReward}` : "—"}
          </p>
        </div>
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3 sm:p-4 text-center">
          <p className="text-[10px] sm:text-xs text-[#555] uppercase tracking-wider mb-1">Execution</p>
          <p className={`text-lg sm:text-2xl font-bold ${
            !trade.executionScore ? "text-[#444]"
            : trade.executionScore >= 4 ? "text-emerald-400"
            : trade.executionScore === 3 ? "text-amber-400"
            : "text-red-400"
          }`}>
            {trade.executionScore ? `${trade.executionScore}/5` : "—"}
          </p>
        </div>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sm:p-5">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Trade Details</h2>
          {row("Strategy", trade.strategy)}
          {row("Entry", trade.entryPrice)}
          {row("Exit", trade.exitPrice ?? "Open")}
          {row("Stop Loss", <span className="text-red-400">{trade.stopLoss}</span>)}
          {row("Take Profit", <span className="text-emerald-400">{trade.takeProfit}</span>)}
          {row("Session", trade.session)}
        </div>
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sm:p-5">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Psychology</h2>
          {row("Emotion", <span className="text-purple-300">{trade.emotion}</span>)}
          {trade.executionScore && row("Execution", (
            <span className={trade.executionScore >= 4 ? "text-emerald-400 font-bold" : trade.executionScore === 3 ? "text-amber-400 font-bold" : "text-red-400 font-bold"}>
              {trade.executionScore}/5
            </span>
          ))}
          {trade.tags?.length > 0 && row("Tags", (
            <div className="flex flex-wrap gap-1 justify-end">
              {trade.tags.map(tag => <span key={tag} className="text-xs bg-[#252525] text-[#888] px-2 py-0.5 rounded">{tag}</span>)}
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
            <p className="text-xs text-[#555] uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-[#888] leading-relaxed whitespace-pre-wrap">
              {trade.notes || <span className="text-[#444] italic">No notes recorded.</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Trade Plan */}
      {(trade.tradePlan || trade.executionNotes) && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sm:p-5 mb-4">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Trade Plan vs Execution</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trade.tradePlan && (
              <div>
                <p className="text-xs text-[#555] uppercase tracking-wider mb-2">Plan</p>
                <p className="text-sm text-[#888] leading-relaxed whitespace-pre-wrap">{trade.tradePlan}</p>
              </div>
            )}
            {trade.executionNotes && (
              <div>
                <p className="text-xs text-[#555] uppercase tracking-wider mb-2">Execution Notes</p>
                <p className="text-sm text-[#888] leading-relaxed whitespace-pre-wrap">{trade.executionNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confluence */}
      {((trade.confluences?.length ?? 0) > 0 || (trade.customConfluences?.length ?? 0) > 0) && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sm:p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest">Confluence</h2>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                  style={{ width: `${Math.min(((trade.confluenceScore ?? 0) / 12) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-amber-400">{trade.confluenceScore ?? 0} factor{(trade.confluenceScore ?? 0) !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {trade.confluences?.map(c => (
              <span key={c} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 border border-amber-500/25 text-amber-300">
                ✓ {c}
              </span>
            ))}
            {trade.customConfluences?.map(c => (
              <span key={c} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-sky-500/10 border border-sky-500/25 text-sky-300">
                ✓ {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Screenshot */}
      {trade.screenshotUrl && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sm:p-5">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Chart Screenshot</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={trade.screenshotUrl} alt="Trade chart" className="w-full rounded-lg border border-[#2a2a2a] object-contain max-h-[400px] sm:max-h-[500px]" />
        </div>
      )}
    </div>
  );
}
