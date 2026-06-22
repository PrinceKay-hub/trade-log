"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTrade } from "@/lib/trades";
import { useAuth } from "@/context/AuthContext";
import { Trade } from "@/types/trade";
import TradeForm from "@/components/TradeForm";

export default function EditTradePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [trade, setTrade] = useState<Trade | null>(null);

  useEffect(() => {
    if (!user) return;
    getTrade(user.uid, id).then(setTrade);
  }, [id, user]);

  if (!trade) return <div className="p-6 text-[#444] animate-pulse">Loading…</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Edit Trade</h1>
        <p className="text-xs sm:text-sm text-[#555] mt-0.5">{trade.pair} · {trade.date}</p>
      </div>
      <TradeForm initial={trade} tradeId={id} />
    </div>
  );
}
