"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getReview, deleteReview } from "@/lib/journal";
import { useAuth } from "@/context/AuthContext";
import { TradeReview } from "@/types/trade";
import Link from "next/link";
import { ArrowLeft, Trash2, Star } from "lucide-react";
import { format, parseISO } from "date-fns";

function StarRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a] last:border-0">
      <span className="text-xs text-[#555] uppercase tracking-wider">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={13} className={i <= value ? "text-amber-400 fill-amber-400" : "text-[#333]"} />
        ))}
      </div>
    </div>
  );
}

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [review, setReview] = useState<TradeReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getReview(user.uid, id).then(r => { setReview(r); setLoading(false); });
  }, [id, user]);

  const handleDelete = async () => {
    if (!user || !confirm("Delete this review?")) return;
    await deleteReview(user.uid, id);
    router.push("/review");
  };

  if (loading) return <div className="p-8 text-[#444] animate-pulse">Loading…</div>;
  if (!review) return <div className="p-8 text-[#555]">Review not found.</div>;

  const sections = [
    { label: "What went well", value: review.wentWell },
    { label: "What went wrong", value: review.wentWrong },
    { label: "Lessons learned", value: review.lessonsLearned },
    { label: "Focus for next period", value: review.nextWeekFocus },
  ].filter(s => s.value);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/review" className="p-2 rounded-lg border border-[#2a2a2a] text-[#666] hover:text-white transition-all">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
              review.periodType === "weekly"
                ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                : "bg-purple-500/10 border-purple-500/20 text-purple-400"
            }`}>{review.periodType === "weekly" ? "Weekly" : "Monthly"}</span>
            <h1 className="text-xl font-bold text-white">{review.periodLabel}</h1>
          </div>
          {review.createdAt && (
            <p className="text-xs text-[#555]">Written {format(parseISO(review.createdAt), "MMMM d, yyyy")}</p>
          )}
        </div>
        <button onClick={handleDelete}
          className="p-2 rounded-lg border border-red-500/20 text-red-500/60 hover:text-red-400 hover:border-red-500/40 transition-all">
          <Trash2 size={15} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Reflection sections */}
        {sections.map(s => (
          <div key={s.label} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
            <p className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">{s.label}</p>
            <p className="text-sm text-[#ccc] leading-relaxed whitespace-pre-wrap">{s.value}</p>
          </div>
        ))}

        {/* Ratings */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <p className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-2">Self Assessment</p>
          <StarRow label="Emotional Control" value={review.emotionRating} />
          <StarRow label="Discipline" value={review.disciplineRating} />
        </div>
      </div>
    </div>
  );
}
