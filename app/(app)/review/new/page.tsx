"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveReview } from "@/lib/journal";
import { useAuth } from "@/context/AuthContext";
import { Star, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format, getWeek } from "date-fns";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)}
          className="transition-transform hover:scale-110">
          <Star size={20} className={i <= value ? "text-amber-400 fill-amber-400" : "text-[#333] hover:text-[#555]"} />
        </button>
      ))}
    </div>
  );
}

export default function NewReviewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const defaultWeekLabel = `${format(now, "yyyy")}-W${String(getWeek(now)).padStart(2, "0")}`;
  const defaultMonthLabel = format(now, "yyyy-MM");

  const [form, setForm] = useState({
    periodType: "weekly" as "weekly" | "monthly",
    periodLabel: defaultWeekLabel,
    wentWell: "",
    wentWrong: "",
    lessonsLearned: "",
    nextWeekFocus: "",
    emotionRating: 3,
    disciplineRating: 3,
  });

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const handlePeriodType = (type: "weekly" | "monthly") => {
    setForm(p => ({
      ...p,
      periodType: type,
      periodLabel: type === "weekly" ? defaultWeekLabel : defaultMonthLabel,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    await saveReview(user.uid, form);
    router.push("/review");
  };

  const inputCls = "w-full bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60 transition-colors";
  const labelCls = "block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wider";
  const prompts = [
    { key: "wentWell", label: "What went well?", placeholder: "Setups I identified correctly, good execution, patience with entries…" },
    { key: "wentWrong", label: "What went wrong?", placeholder: "Mistakes made, rules broken, emotional decisions, missed setups…" },
    { key: "lessonsLearned", label: "Lessons learned", placeholder: "What are the key takeaways? What will I do differently?" },
    { key: "nextWeekFocus", label: "Focus for next period", placeholder: "One or two specific things to work on in the next period…" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/review" className="p-2 rounded-lg border border-[#2a2a2a] text-[#666] hover:text-white hover:border-[#3a3a3a] transition-all">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">New Review</h1>
          <p className="text-xs text-[#555] mt-0.5">Reflect honestly — this is for your growth</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Period type */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <label className={labelCls}>Review Period</label>
          <div className="flex gap-2 mb-4">
            {(["weekly", "monthly"] as const).map(type => (
              <button key={type} type="button" onClick={() => handlePeriodType(type)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${
                  form.periodType === type
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "border-[#2a2a2a] text-[#555] hover:border-[#3a3a3a] hover:text-[#aaa]"
                }`}>{type}</button>
            ))}
          </div>
          <div>
            <label className={labelCls}>Period Label</label>
            <input value={form.periodLabel} onChange={e => set("periodLabel", e.target.value)}
              placeholder={form.periodType === "weekly" ? "e.g. 2024-W03" : "e.g. 2024-01"}
              className={inputCls} required />
            <p className="text-[10px] text-[#444] mt-1">
              {form.periodType === "weekly" ? "Format: YYYY-Www (current: " + defaultWeekLabel + ")" : "Format: YYYY-MM (current: " + defaultMonthLabel + ")"}
            </p>
          </div>
        </div>

        {/* Reflection prompts */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 space-y-5">
          <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest">Reflection</h3>
          {prompts.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <textarea value={(form as unknown as Record<string, string>)[key]} onChange={e => set(key, e.target.value)}
                rows={3} placeholder={placeholder} className={`${inputCls} resize-none`} />
            </div>
          ))}
        </div>

        {/* Ratings */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-5">Self Assessment</h3>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Emotional Control</label>
              <p className="text-xs text-[#555] mb-2">How well did you manage your emotions this period?</p>
              <StarPicker value={form.emotionRating} onChange={v => set("emotionRating", v)} />
            </div>
            <div>
              <label className={labelCls}>Discipline & Rule Following</label>
              <p className="text-xs text-[#555] mb-2">How strictly did you stick to your trading rules?</p>
              <StarPicker value={form.disciplineRating} onChange={v => set("disciplineRating", v)} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/review"
            className="px-5 py-2.5 rounded-lg border border-[#2a2a2a] text-sm text-[#666] hover:text-white hover:border-[#3a3a3a] transition-all">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Save Review
          </button>
        </div>
      </form>
    </div>
  );
}
