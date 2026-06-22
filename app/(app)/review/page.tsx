"use client";

import { useEffect, useState } from "react";
import { getReviews, deleteReview } from "@/lib/journal";
import { getAllTrades } from "@/lib/trades";
import { useAuth } from "@/context/AuthContext";
import { TradeReview, Trade } from "@/types/trade";
import Link from "next/link";
import { Plus, Trash2, Eye, ClipboardList, Star } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={11} className={i <= value ? "text-amber-400 fill-amber-400" : "text-[#333]"} />
      ))}
    </div>
  );
}

function getWeekTrades(trades: Trade[], label: string): Trade[] {
  // label like "2024-W03"
  const [year, wStr] = label.split("-W");
  const weekNum = parseInt(wStr);
  return trades.filter(t => {
    const d = parseISO(t.date);
    const w = Math.ceil((d.getDate() - d.getDay() + 1) / 7);
    return d.getFullYear() === parseInt(year) && w === weekNum;
  });
}

function getMonthTrades(trades: Trade[], label: string): Trade[] {
  return trades.filter(t => t.date.startsWith(label));
}

export default function ReviewPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<TradeReview[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [r, t] = await Promise.all([getReviews(user.uid), getAllTrades(user.uid)]);
    setReviews(r);
    setTrades(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Delete this review?")) return;
    setDeleting(id);
    await deleteReview(user.uid, id);
    await load();
    setDeleting(null);
  };

  if (loading) return <div className="p-8 text-[#444] animate-pulse">Loading reviews…</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Trade Reviews</h1>
          <p className="text-xs sm:text-sm text-[#555] mt-0.5">Structured reflection to accelerate improvement</p>
        </div>
        <Link href="/review/new"
          className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-semibold rounded-lg transition-all">
          <Plus size={15} /> <span className="hidden sm:inline">New Review</span><span className="sm:hidden">New</span>
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-14 h-14 rounded-2xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={24} className="text-[#444]" />
          </div>
          <h2 className="text-base font-semibold text-[#888] mb-2">No reviews yet</h2>
          <p className="text-sm text-[#555] mb-5 max-w-xs mx-auto">Weekly and monthly reviews are the fastest way to spot patterns and stop repeating mistakes.</p>
          <Link href="/review/new" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg transition-all">
            Write your first review
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => {
            const ts = review.periodType === "weekly"
              ? getWeekTrades(trades, review.periodLabel)
              : getMonthTrades(trades, review.periodLabel);
            const wins = ts.filter(t => t.outcome === "WIN").length;
            const closed = ts.filter(t => t.outcome !== "OPEN");
            const pnl = ts.reduce((s, t) => s + (t.pnl ?? 0), 0);

            return (
              <div key={review.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        review.periodType === "weekly"
                          ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                          : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                      }`}>
                        {review.periodType === "weekly" ? "Weekly" : "Monthly"}
                      </span>
                      <span className="text-sm font-semibold text-white">{review.periodLabel}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#555]">
                      {ts.length > 0 && (
                        <>
                          <span>{ts.length} trades</span>
                          <span className={pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                          </span>
                          {closed.length > 0 && <span>{Math.round((wins / closed.length) * 100)}% WR</span>}
                        </>
                      )}
                      {review.createdAt && (
                        <span>Written {format(parseISO(review.createdAt), "MMM d")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Link href={`/review/${review.id}`}
                      className="p-2 rounded-lg border border-[#2a2a2a] text-[#555] hover:text-white hover:border-[#3a3a3a] transition-all">
                      <Eye size={14} />
                    </Link>
                    <button onClick={() => handleDelete(review.id!)} disabled={deleting === review.id}
                      className="p-2 rounded-lg border border-red-500/20 text-red-500/60 hover:text-red-400 hover:border-red-500/40 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[#888] line-clamp-2 mb-3">{review.lessonsLearned || review.wentWell}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#555]">Emotion</span>
                    <StarRating value={review.emotionRating} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#555]">Discipline</span>
                    <StarRating value={review.disciplineRating} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
