"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Trade, Direction, Outcome, Session, Emotion, PRESET_CONFLUENCES } from "@/types/trade";
import { addTrade, updateTrade } from "@/lib/trades";
import { useAuth } from "@/context/AuthContext";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Upload, X, Loader2, Plus, CheckSquare } from "lucide-react";

const PAIRS = [
  "XAUUSD", "XAGUSD", "USOIL", "UKOIL",
  "BTCUSD", "ETHUSD", "SOLUSD", "BNBUSD", "XRPUSD", "ADAUSD",
];
const DIRECTIONS: Direction[] = ["BUY", "SELL"];
const SESSIONS: Session[] = ["London", "New York", "Asia", "Sydney", "Overlap"];
const OUTCOMES: Outcome[] = ["WIN", "LOSS", "BREAKEVEN", "OPEN"];
const EMOTIONS: Emotion[] = ["Calm", "Confident", "Anxious", "Greedy", "Fearful", "Revenge", "FOMO", "Neutral"];

interface TradeFormProps {
  initial?: Partial<Trade>;
  tradeId?: string;
}

export default function TradeForm({ initial, tradeId }: TradeFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initial?.screenshotUrl || "");
  const [error, setError] = useState("");
  const [customInput, setCustomInput] = useState("");

  const [form, setForm] = useState<Omit<Trade, "id" | "createdAt">>({
    date: initial?.date || new Date().toISOString().split("T")[0],
    pair: initial?.pair || "XAUUSD",
    direction: initial?.direction || "BUY",
    session: initial?.session || "London",
    strategy: initial?.strategy || "",
    entryPrice: initial?.entryPrice || 0,
    exitPrice: initial?.exitPrice ?? null,
    stopLoss: initial?.stopLoss || 0,
    takeProfit: initial?.takeProfit || 0,
    lotSize: initial?.lotSize || 0.01,
    riskReward: initial?.riskReward ?? null,
    outcome: initial?.outcome || "OPEN",
    pnl: initial?.pnl ?? null,
    emotion: initial?.emotion || "Neutral",
    notes: initial?.notes || "",
    screenshotUrl: initial?.screenshotUrl || null,
    tags: initial?.tags || [],
    confluences: initial?.confluences || [],
    customConfluences: initial?.customConfluences || [],
    confluenceScore: initial?.confluenceScore || 0,
    tradePlan: initial?.tradePlan || "",
    executionScore: initial?.executionScore ?? null,
    executionNotes: initial?.executionNotes || "",
  });

  const calcRR = (entry: number, sl: number, tp: number) => {
    if (!entry || !sl || !tp) return null;
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    if (risk === 0) return null;
    return Math.round((reward / risk) * 100) / 100;
  };

  const set = (key: keyof typeof form, value: unknown) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (["entryPrice", "stopLoss", "takeProfit"].includes(key)) {
        updated.riskReward = calcRR(
          key === "entryPrice" ? (value as number) : prev.entryPrice,
          key === "stopLoss" ? (value as number) : prev.stopLoss,
          key === "takeProfit" ? (value as number) : prev.takeProfit,
        );
      }
      return updated;
    });
  };

  // Toggle a preset confluence
  const togglePreset = (name: string) => {
    setForm(prev => {
      const has = prev.confluences.includes(name);
      const confluences = has
        ? prev.confluences.filter(c => c !== name)
        : [...prev.confluences, name];
      return { ...prev, confluences, confluenceScore: confluences.length + prev.customConfluences.length };
    });
  };

  // Add custom confluence
  const addCustom = () => {
    const val = customInput.trim();
    if (!val || form.customConfluences.includes(val)) return;
    setForm(prev => {
      const customConfluences = [...prev.customConfluences, val];
      return { ...prev, customConfluences, confluenceScore: prev.confluences.length + customConfluences.length };
    });
    setCustomInput("");
  };

  const removeCustom = (val: string) => {
    setForm(prev => {
      const customConfluences = prev.customConfluences.filter(c => c !== val);
      return { ...prev, customConfluences, confluenceScore: prev.confluences.length + customConfluences.length };
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addCustom(); }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      let screenshotUrl = form.screenshotUrl;
      if (imageFile) {
        const storageRef = ref(storage, `screenshots/${user.uid}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        screenshotUrl = await getDownloadURL(storageRef);
      }
      const payload = { ...form, screenshotUrl };
      if (tradeId) {
        await updateTrade(user.uid, tradeId, payload);
      } else {
        await addTrade(user.uid, payload);
      }
      router.push("/trades");
      router.refresh();
    } catch (err) {
      setError("Failed to save trade. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60 transition-colors";
  const labelCls = "block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wider";
  const totalConfluence = form.confluences.length + form.customConfluences.length;
  const maxScore = PRESET_CONFLUENCES.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Core Trade Info */}
      <section>
        <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Trade Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Pair / Asset</label>
            <select value={form.pair} onChange={e => set("pair", e.target.value)} className={inputCls}>
              {PAIRS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Direction</label>
            <div className="flex gap-2">
              {DIRECTIONS.map(d => (
                <button key={d} type="button" onClick={() => set("direction", d)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                    form.direction === d
                      ? d === "BUY" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-red-500/20 border-red-500/50 text-red-400"
                      : "border-[#2a2a2a] text-[#555] hover:border-[#3a3a3a]"
                  }`}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Session</label>
            <select value={form.session} onChange={e => set("session", e.target.value as Session)} className={inputCls}>
              {SESSIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Strategy / Setup</label>
            <input type="text" value={form.strategy} onChange={e => set("strategy", e.target.value)}
              placeholder="e.g. Break of Structure, OB Retest…" className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Lot Size</label>
            <input type="number" step="0.01" min="0.01" value={form.lotSize}
              onChange={e => set("lotSize", parseFloat(e.target.value))} className={inputCls} />
          </div>
        </div>
      </section>

      {/* Price Levels */}
      <section>
        <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Price Levels</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>Entry</label>
            <input type="number" step="any" value={form.entryPrice || ""}
              onChange={e => set("entryPrice", parseFloat(e.target.value) || 0)} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Exit</label>
            <input type="number" step="any" value={form.exitPrice ?? ""}
              onChange={e => set("exitPrice", e.target.value ? parseFloat(e.target.value) : null)} className={inputCls} placeholder="Optional" />
          </div>
          <div>
            <label className={labelCls}>Stop Loss</label>
            <input type="number" step="any" value={form.stopLoss || ""}
              onChange={e => set("stopLoss", parseFloat(e.target.value) || 0)} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Take Profit</label>
            <input type="number" step="any" value={form.takeProfit || ""}
              onChange={e => set("takeProfit", parseFloat(e.target.value) || 0)} className={inputCls} required />
          </div>
        </div>
        {form.riskReward !== null && form.riskReward !== undefined && (
          <div className="mt-3 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
            <span className="text-xs text-[#888]">Auto R:R</span>
            <span className="text-amber-400 font-bold text-sm">1:{form.riskReward}</span>
          </div>
        )}
      </section>

      {/* Confluence */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest flex items-center gap-2">
            <CheckSquare size={13} className="text-[#555]" />
            Confluence
          </h3>
          {totalConfluence > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
                  style={{ width: `${Math.min((totalConfluence / maxScore) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-amber-400">{totalConfluence}/{maxScore}</span>
            </div>
          )}
        </div>

        {/* Preset grid */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_CONFLUENCES.map(name => {
            const active = form.confluences.includes(name);
            return (
              <button key={name} type="button" onClick={() => togglePreset(name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  active
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                    : "border-[#2a2a2a] text-[#555] hover:border-[#3a3a3a] hover:text-[#aaa]"
                }`}>
                {active && <span className="mr-1">✓</span>}{name}
              </button>
            );
          })}
        </div>

        {/* Custom confluences */}
        <div>
          <label className={labelCls}>Custom Confluences</label>
          <div className="flex gap-2 mb-2">
            <input
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a confluence and press Enter…"
              className={`${inputCls} flex-1`}
            />
            <button type="button" onClick={addCustom}
              className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] hover:text-white hover:border-[#3a3a3a] transition-all">
              <Plus size={16} />
            </button>
          </div>
          {form.customConfluences.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.customConfluences.map(c => (
                <span key={c} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs">
                  {c}
                  <button type="button" onClick={() => removeCustom(c)} className="text-sky-400/60 hover:text-sky-300 transition-colors">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Result */}
      <section>
        <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Result</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Outcome</label>
            <div className="flex flex-wrap gap-2">
              {OUTCOMES.map(o => (
                <button key={o} type="button" onClick={() => set("outcome", o)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    form.outcome === o
                      ? o === "WIN" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : o === "LOSS" ? "bg-red-500/20 border-red-500/50 text-red-400"
                        : o === "BREAKEVEN" ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                        : "bg-sky-500/20 border-sky-500/50 text-sky-400"
                      : "border-[#2a2a2a] text-[#555] hover:border-[#3a3a3a]"
                  }`}>{o}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>P&L ($)</label>
            <input type="number" step="any" value={form.pnl ?? ""}
              onChange={e => set("pnl", e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="Optional" className={inputCls} />
          </div>
        </div>
      </section>

      {/* Psychology */}
      <section>
        <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Psychology</h3>
        <label className={labelCls}>Emotional State</label>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map(em => (
            <button key={em} type="button" onClick={() => set("emotion", em)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                form.emotion === em
                  ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                  : "border-[#2a2a2a] text-[#555] hover:border-[#3a3a3a] hover:text-[#aaa]"
              }`}>{em}</button>
          ))}
        </div>
      </section>

      {/* Trade Plan vs Execution */}
      <section>
        <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Trade Plan vs Execution</h3>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Trade Plan (before entry)</label>
            <textarea value={form.tradePlan || ""} onChange={e => set("tradePlan", e.target.value)}
              rows={3} placeholder="What is your plan? Entry criteria, SL placement reasoning, TP target, invalidation point…"
              className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Execution Score</label>
            <p className="text-xs text-[#555] mb-2">How well did you follow your plan?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(score => (
                <button key={score} type="button" onClick={() => set("executionScore", score)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-all ${
                    form.executionScore === score
                      ? score >= 4 ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : score === 3 ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                        : "bg-red-500/20 border-red-500/50 text-red-400"
                      : "border-[#2a2a2a] text-[#555] hover:border-[#3a3a3a] hover:text-[#aaa]"
                  }`}>
                  {score}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-[#444] mt-1 px-1">
              <span>Ignored plan</span>
              <span>Partial</span>
              <span>Followed perfectly</span>
            </div>
          </div>
          <div>
            <label className={labelCls}>Execution Notes</label>
            <textarea value={form.executionNotes || ""} onChange={e => set("executionNotes", e.target.value)}
              rows={2} placeholder="Did you follow your plan? What deviated and why?"
              className={`${inputCls} resize-none`} />
          </div>
        </div>
      </section>

      {/* Notes */}
      <section>
        <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Notes</h3>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
          rows={4} placeholder="What did you see? Why did you take this trade? What could be improved?"
          className={`${inputCls} resize-none`} />
      </section>

      {/* Screenshot */}
      <section>
        <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Screenshot</h3>
        {imagePreview ? (
          <div className="relative inline-block max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Trade screenshot" className="max-h-64 w-full rounded-xl border border-[#2a2a2a] object-contain" />
            <button type="button" onClick={() => { setImagePreview(""); setImageFile(null); set("screenshotUrl", null); }}
              className="absolute top-2 right-2 bg-black/70 rounded-full p-1 text-white hover:text-red-400 transition-colors">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-3 px-5 py-4 w-full sm:w-auto border border-dashed border-[#2a2a2a] rounded-xl text-sm text-[#555] hover:border-amber-500/40 hover:text-amber-400/60 transition-all">
            <Upload size={16} /> Upload chart screenshot
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
      </section>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 rounded-lg border border-[#2a2a2a] text-sm text-[#666] hover:text-white hover:border-[#3a3a3a] transition-all">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin" />}
          {tradeId ? "Save Changes" : "Log Trade"}
        </button>
      </div>
    </form>
  );
}
