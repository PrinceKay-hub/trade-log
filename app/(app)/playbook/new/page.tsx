"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveSetup } from "@/lib/journal";
import { useAuth } from "@/context/AuthContext";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { PlaybookSetup } from "@/types/trade";
import Link from "next/link";
import { Plus, X, Upload, Loader2 } from "lucide-react";

const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "Daily", "Weekly"];
const SESSIONS = ["London", "New York", "Asia", "Sydney", "Overlap"];

export default function NewSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [ruleInput, setRuleInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const [form, setForm] = useState<Omit<PlaybookSetup, "id" | "createdAt" | "updatedAt">>({
    name: "",
    description: "",
    rules: [],
    timeframes: [],
    sessions: [],
    tags: [],
    screenshotUrl: null,
  });

  const set = (k: keyof typeof form, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const toggleItem = (key: "timeframes" | "sessions", val: string) => {
    setForm(p => {
      const arr = p[key] as string[];
      return { ...p, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  };

  const addRule = () => {
    const v = ruleInput.trim();
    if (!v || form.rules.includes(v)) return;
    set("rules", [...form.rules, v]);
    setRuleInput("");
  };

  const addTag = () => {
    const v = tagInput.trim();
    if (!v || form.tags.includes(v)) return;
    set("tags", [...form.tags, v]);
    setTagInput("");
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
    try {
      let screenshotUrl = form.screenshotUrl;
      if (imageFile) {
        const storageRef = ref(storage, `playbook/${user.uid}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        screenshotUrl = await getDownloadURL(storageRef);
      }
      await saveSetup(user.uid, { ...form, screenshotUrl });
      router.push("/playbook");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60 transition-colors";
  const labelCls = "block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wider";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">New Setup</h1>
        <p className="text-xs sm:text-sm text-[#555] mt-0.5">Document an ICT/SMC setup with rules and conditions.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basics */}
        <section className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest">Setup Info</h3>
          <div>
            <label className={labelCls}>Setup Name</label>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="e.g. OB Retest at Discount, BOS + FVG Fill…"
              className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              rows={3} placeholder="Describe the market conditions and concept behind this setup…"
              className={`${inputCls} resize-none`} />
          </div>
        </section>

        {/* Timeframes & Sessions */}
        <section className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 space-y-5">
          <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest">Timeframes & Sessions</h3>
          <div>
            <label className={labelCls}>Timeframes</label>
            <div className="flex flex-wrap gap-2">
              {TIMEFRAMES.map(tf => (
                <button key={tf} type="button" onClick={() => toggleItem("timeframes", tf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.timeframes.includes(tf)
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                      : "border-[#2a2a2a] text-[#555] hover:border-[#3a3a3a] hover:text-[#aaa]"
                  }`}>{tf}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Sessions</label>
            <div className="flex flex-wrap gap-2">
              {SESSIONS.map(s => (
                <button key={s} type="button" onClick={() => toggleItem("sessions", s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.sessions.includes(s)
                      ? "bg-sky-500/15 border-sky-500/40 text-sky-300"
                      : "border-[#2a2a2a] text-[#555] hover:border-[#3a3a3a] hover:text-[#aaa]"
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        </section>

        {/* Rules */}
        <section className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Entry Rules</h3>
          <p className="text-xs text-[#555] mb-4">Define the exact conditions that must be met before taking this setup.</p>
          <div className="flex gap-2 mb-3">
            <input value={ruleInput} onChange={e => setRuleInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addRule())}
              placeholder="e.g. Price must be in discount zone (below 50% level)…"
              className={`${inputCls} flex-1`} />
            <button type="button" onClick={addRule}
              className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] hover:text-white hover:border-[#3a3a3a] transition-all">
              <Plus size={16} />
            </button>
          </div>
          {form.rules.length > 0 && (
            <ol className="space-y-2">
              {form.rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-3 group">
                  <span className="text-xs text-amber-400 font-bold mt-0.5 w-4 shrink-0">{i + 1}.</span>
                  <span className="text-sm text-[#ccc] flex-1">{rule}</span>
                  <button type="button" onClick={() => set("rules", form.rules.filter((_, j) => j !== i))}
                    className="text-[#444] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Tags */}
        <section className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Tags</h3>
          <div className="flex gap-2 mb-3">
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="e.g. continuation, reversal, mitigation…"
              className={`${inputCls} flex-1`} />
            <button type="button" onClick={addTag}
              className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] hover:text-white hover:border-[#3a3a3a] transition-all">
              <Plus size={16} />
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1f1f1f] border border-[#2a2a2a] text-[#888] text-xs">
                  {tag}
                  <button type="button" onClick={() => set("tags", form.tags.filter(t => t !== tag))}
                    className="text-[#555] hover:text-white transition-colors"><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Screenshot */}
        <section className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Example Screenshot</h3>
          {imagePreview ? (
            <div className="relative inline-block max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Setup example" className="max-h-64 w-full rounded-xl border border-[#2a2a2a] object-contain" />
              <button type="button" onClick={() => { setImagePreview(""); setImageFile(null); }}
                className="absolute top-2 right-2 bg-black/70 rounded-full p-1 text-white hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-3 px-5 py-4 w-full border border-dashed border-[#2a2a2a] rounded-xl text-sm text-[#555] hover:border-amber-500/40 hover:text-amber-400/60 transition-all">
              <Upload size={16} /> Upload an example chart image
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </section>

        <div className="flex gap-3">
          <Link href="/playbook"
            className="px-5 py-2.5 rounded-lg border border-[#2a2a2a] text-sm text-[#666] hover:text-white hover:border-[#3a3a3a] transition-all">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Save Setup
          </button>
        </div>
      </form>
    </div>
  );
}
