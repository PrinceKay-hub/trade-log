"use client";

import { useEffect, useState } from "react";
import { getSetups, deleteSetup } from "@/lib/journal";
import { getAllTrades as getTrades } from "@/lib/trades";
import { useAuth } from "@/context/AuthContext";
import { PlaybookSetup, Trade } from "@/types/trade";
import Link from "next/link";
import { Plus, Trash2, Eye, BookMarked, TrendingUp, TrendingDown } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function PlaybookPage() {
  const { user } = useAuth();
  const [setups, setSetups] = useState<PlaybookSetup[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [s, t] = await Promise.all([getSetups(user.uid), getTrades(user.uid)]);
    setSetups(s);
    setTrades(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Delete this setup?")) return;
    setDeleting(id);
    await deleteSetup(user.uid, id);
    await load();
    setDeleting(null);
  };

  // compute live stats per setup by matching strategy name
  const statsFor = (setup: PlaybookSetup) => {
    const linked = trades.filter(t =>
      t.strategy.toLowerCase().includes(setup.name.toLowerCase()) ||
      setup.name.toLowerCase().includes(t.strategy.toLowerCase())
    ).filter(t => t.outcome !== "OPEN");
    const wins = linked.filter(t => t.outcome === "WIN").length;
    const pnl = linked.reduce((s, t) => s + (t.pnl ?? 0), 0);
    return {
      total: linked.length,
      winRate: linked.length ? Math.round((wins / linked.length) * 100) : null,
      pnl: Math.round(pnl * 100) / 100,
    };
  };

  if (loading) return <div className="p-8 text-[#444] animate-pulse">Loading playbook…</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <BookMarked size={18} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Playbook</h1>
            <p className="text-xs sm:text-sm text-[#555] mt-0.5">Your documented ICT/SMC setups</p>
          </div>
        </div>
        <Link href="/playbook/new"
          className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-semibold rounded-lg transition-all">
          <Plus size={15} /> <span className="hidden sm:inline">New Setup</span><span className="sm:hidden">New</span>
        </Link>
      </div>

      {setups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center mb-4">
            <BookMarked size={28} className="text-[#444]" />
          </div>
          <h2 className="text-lg font-semibold text-[#888] mb-2">No setups yet</h2>
          <p className="text-sm text-[#555] mb-6 max-w-xs">Document your ICT setups with rules and screenshots so you trade them consistently.</p>
          <Link href="/playbook/new" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg transition-all">
            Add your first setup
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {setups.map(setup => {
            const stats = statsFor(setup);
            return (
              <div key={setup.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 flex flex-col hover:border-[#3a3a3a] transition-colors group">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-base font-bold text-white leading-tight">{setup.name}</h2>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/playbook/${setup.id}`}
                      className="p-1.5 rounded-md hover:bg-[#252525] text-[#555] hover:text-white transition-all">
                      <Eye size={13} />
                    </Link>
                    <button onClick={() => handleDelete(setup.id!)} disabled={deleting === setup.id}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-[#555] hover:text-red-400 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#666] leading-relaxed mb-4 flex-1 line-clamp-3">{setup.description || "No description."}</p>

                {/* Tags */}
                {setup.sessions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {setup.sessions.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400">{s}</span>
                    ))}
                    {setup.timeframes.map(tf => (
                      <span key={tf} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">{tf}</span>
                    ))}
                  </div>
                )}

                {/* Live stats */}
                {stats.total > 0 ? (
                  <div className="flex items-center justify-between pt-3 border-t border-[#1f1f1f]">
                    <div className="text-center">
                      <p className="text-[10px] text-[#555] mb-0.5">Trades</p>
                      <p className="text-sm font-bold text-[#aaa]">{stats.total}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-[#555] mb-0.5">Win Rate</p>
                      <p className={`text-sm font-bold ${(stats.winRate ?? 0) >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                        {stats.winRate}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-[#555] mb-0.5">P&L</p>
                      <div className={`flex items-center gap-0.5 text-sm font-bold ${stats.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {stats.pnl >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        ${Math.abs(stats.pnl).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-[#1f1f1f]">
                    <p className="text-[10px] text-[#444] italic">No matching trades logged yet</p>
                  </div>
                )}

                {/* Screenshot thumb */}
                {setup.screenshotUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={setup.screenshotUrl} alt={setup.name}
                    className="mt-3 w-full h-24 object-cover rounded-lg border border-[#2a2a2a]" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
