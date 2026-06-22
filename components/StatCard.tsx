"use client";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  color?: "green" | "red" | "blue" | "yellow" | "default";
  large?: boolean;
}

const colorMap = {
  green: "text-emerald-400",
  red: "text-red-400",
  blue: "text-sky-400",
  yellow: "text-amber-400",
  default: "text-white",
};

export default function StatCard({ label, value, sub, icon, color = "default", large }: StatCardProps) {
  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-2 hover:border-[#3a3a3a] transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#666] uppercase tracking-widest">{label}</span>
        {icon && <span className="text-[#444]">{icon}</span>}
      </div>
      <span className={`font-bold ${large ? "text-3xl" : "text-2xl"} ${colorMap[color]} tabular-nums`}>
        {value}
      </span>
      {sub && <span className="text-xs text-[#555]">{sub}</span>}
    </div>
  );
}
