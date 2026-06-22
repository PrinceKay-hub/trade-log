"use client";

import { useEffect, useState } from "react";
import { getRiskSettings, saveRiskSettings } from "@/lib/journal";
import { getAllTrades } from "@/lib/trades";
import { useAuth } from "@/context/AuthContext";
import { RiskSettings, Trade } from "@/types/trade";
import { Shield, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function RiskPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<RiskSettings>({
    accountBalance: 1000,
    maxDailyLossPercent: 2,
    maxRiskPerTradePercent: 1,
  });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([getRiskSettings(user.uid), getAllTrades(user.uid)]).then(([s, t]) => {
      if (s) setSettings(s);
      setTrades(t);
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await saveRiskSettings(user.uid, settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Today's P&L
  const today = format(new Date(), "yyyy-MM-dd");
  const todayTrades = trades.filter(t => t.date === today && t.pnl !== null);
  const todayPnl = todayTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const maxDailyLoss = -(settings.accountBalance * settings.maxDailyLossPercent / 100);
  const dailyLossUsed = todayPnl < 0 ? Math.abs(todayPnl) : 0;
  const dailyLossLimit = Math.abs(maxDailyLoss);
  const dailyPct = Math.min((dailyLossUsed / dailyLossLimit) * 100, 100);
  const dailyBreached = todayPnl <= maxDailyLoss;

  // Per-trade risk
  const maxRiskPerTrade = settings.accountBalance * settings.maxRiskPerTradePercent / 100;

  // Open trades risk
  const openTrades = trades.filter(t => t.outcome === "OPEN");

  // Recent daily P&L for the last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = format(d, "yyyy-MM-dd");
    const ts = trades.filter(t => t.date === ds && t.pnl !== null);
    const pnl = ts.reduce((s, t) => s + (t.pnl ?? 0), 0);
    return { date: ds, label: format(d, "EEE"), pnl, count: ts.length };
  }).reverse();

  const inputCls = "w-full bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60 transition-colors";
  const labelCls = "block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wider";

  if (loading) return <div className="p-8 text-[#444] animate-pulse">Loading risk manager…</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Shield size={18} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Risk Manager</h1>
          <p className="text-xs sm:text-sm text-[#555] mt-0.5">Protect your account with clear limits</p>
        </div>
      </div>

      {/* Daily limit alert */}
      {dailyBreached && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300 font-medium">Daily loss limit reached — stop trading for today.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Settings form */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-5">Account Settings</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Account Balance ($)</label>
              <input type="number" min="0" step="100" value={settings.accountBalance}
                onChange={e => setSettings(s => ({ ...s, accountBalance: parseFloat(e.target.value) || 0 }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Max Daily Loss (%)</label>
              <input type="number" min="0.1" max="100" step="0.1" value={settings.maxDailyLossPercent}
                onChange={e => setSettings(s => ({ ...s, maxDailyLossPercent: parseFloat(e.target.value) || 0 }))}
                className={inputCls} />
              <p className="text-xs text-[#555] mt-1">= ${(settings.accountBalance * settings.maxDailyLossPercent / 100).toFixed(2)} max loss per day</p>
            </div>
            <div>
              <label className={labelCls}>Max Risk Per Trade (%)</label>
              <input type="number" min="0.1" max="100" step="0.1" value={settings.maxRiskPerTradePercent}
                onChange={e => setSettings(s => ({ ...s, maxRiskPerTradePercent: parseFloat(e.target.value) || 0 }))}
                className={inputCls} />
              <p className="text-xs text-[#555] mt-1">= ${maxRiskPerTrade.toFixed(2)} max risk per trade</p>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-all disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Shield size={14} />}
              {saved ? "Saved!" : "Save Settings"}
            </button>
          </div>
        </div>

        {/* Today's dashboard */}
        <div className="space-y-4">
          {/* Daily loss meter */}
          <div className={`bg-[#141414] border rounded-xl p-5 ${dailyBreached ? "border-red-500/40" : "border-[#2a2a2a]"}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest">Today&apos;s Risk</h2>
              <span className="text-xs text-[#555]">{format(new Date(), "MMM d")}</span>
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className={`text-2xl font-bold tabular-nums ${todayPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {todayPnl >= 0 ? "+" : ""}${todayPnl.toFixed(2)}
              </span>
              <span className="text-xs text-[#555]">Limit: -${dailyLossLimit.toFixed(2)}</span>
            </div>
            <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${dailyPct > 80 ? "bg-red-500" : dailyPct > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${dailyPct}%` }} />
            </div>
            <p className="text-xs text-[#555] mt-1.5">{dailyPct.toFixed(0)}% of daily limit used · {todayTrades.length} trade{todayTrades.length !== 1 ? "s" : ""} today</p>
          </div>

          {/* Max risk per trade */}
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
            <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Max Risk Per Trade</h2>
            <p className="text-2xl font-bold text-amber-400">${maxRiskPerTrade.toFixed(2)}</p>
            <p className="text-xs text-[#555] mt-1">{settings.maxRiskPerTradePercent}% of ${settings.accountBalance.toLocaleString()}</p>
          </div>

          {/* Open trades */}
          {openTrades.length > 0 && (
            <div className="bg-[#141414] border border-sky-500/20 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-sky-400/70 uppercase tracking-widest mb-3">Open Trades ({openTrades.length})</h2>
              <div className="space-y-2">
                {openTrades.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-xs">
                    <span className="text-[#ccc] font-medium">{t.pair}</span>
                    <span className={t.direction === "BUY" ? "text-emerald-400" : "text-red-400"}>{t.direction}</span>
                    <span className="text-[#666]">{t.session}</span>
                    <span className="text-sky-400">Open</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Last 7 days */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
        <h2 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Last 7 Days</h2>
        <div className="grid grid-cols-7 gap-2">
          {last7.map(d => (
            <div key={d.date} className="text-center">
              <p className="text-[10px] text-[#555] mb-2">{d.label}</p>
              <div className={`rounded-lg py-2 px-1 ${
                d.count === 0 ? "bg-[#1a1a1a]"
                : d.pnl > 0 ? "bg-emerald-500/10 border border-emerald-500/20"
                : d.pnl < 0 ? "bg-red-500/10 border border-red-500/20"
                : "bg-amber-500/10 border border-amber-500/20"
              }`}>
                <p className={`text-xs font-bold tabular-nums ${
                  d.count === 0 ? "text-[#444]"
                  : d.pnl > 0 ? "text-emerald-400"
                  : d.pnl < 0 ? "text-red-400"
                  : "text-amber-400"
                }`}>
                  {d.count === 0 ? "—" : `${d.pnl >= 0 ? "+" : ""}$${d.pnl.toFixed(0)}`}
                </p>
                {d.count > 0 && <p className="text-[9px] text-[#555] mt-0.5">{d.count}t</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
