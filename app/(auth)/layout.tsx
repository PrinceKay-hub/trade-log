export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex w-[420px] shrink-0 bg-[#0c0c0c] border-r border-[#1a1a1a] flex-col justify-between p-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">TradeLog</p>
            <p className="text-[10px] text-[#555] uppercase tracking-widest">Journal</p>
          </div>
        </div>

        <div>
          <blockquote className="text-2xl font-semibold text-white leading-snug mb-4">
            &ldquo;The goal of a successful trader is to make the best trades.&rdquo;
          </blockquote>
          <p className="text-sm text-[#555]">— Mark Douglas</p>
        </div>

        <div className="space-y-3">
          {[
            { label: "Track every trade", desc: "Entry, exit, SL/TP, R:R — all in one place" },
            { label: "Review your psychology", desc: "Log emotions and identify bad habits" },
            { label: "Spot what works", desc: "Analytics across sessions, pairs, and strategies" },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#ccc]">{label}</p>
                <p className="text-xs text-[#555]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
