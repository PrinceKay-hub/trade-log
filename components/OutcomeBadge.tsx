import { Outcome } from "@/types/trade";

const styles: Record<Outcome, string> = {
  WIN: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  LOSS: "bg-red-500/15 text-red-400 border border-red-500/30",
  BREAKEVEN: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  OPEN: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
};

export default function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${styles[outcome]}`}>
      {outcome}
    </span>
  );
}
