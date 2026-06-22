"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Eye, EyeOff, TrendingUp } from "lucide-react";

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signUp(email, password, name);
      router.push("/");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-[#0e0e0e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-amber-500/60 transition-colors";

  return (
    <div className="w-full max-w-sm">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 mb-8 lg:hidden">
        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <TrendingUp size={15} className="text-black" />
        </div>
        <span className="text-sm font-bold text-white">TradeLog</span>
      </div>

      <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
      <p className="text-sm text-[#555] mb-8">Start journaling your trades today</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#888] mb-2 uppercase tracking-wider">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={inputCls}
            required
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#888] mb-2 uppercase tracking-wider">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#888] mb-2 uppercase tracking-wider">Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className={`${inputCls} pr-11`}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] transition-colors"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          Create account
        </button>
      </form>

      <p className="text-sm text-[#555] text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
