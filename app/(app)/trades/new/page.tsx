import TradeForm from "@/components/TradeForm";

export default function NewTradePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Log New Trade</h1>
        <p className="text-xs sm:text-sm text-[#555] mt-0.5">Record your trade details, psychology, and outcome.</p>
      </div>
      <TradeForm />
    </div>
  );
}
