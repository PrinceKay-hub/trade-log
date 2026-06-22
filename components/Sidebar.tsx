"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, BookOpen, BarChart2, PlusCircle, TrendingUp,
  LogOut, User, BookMarked, Shield, CalendarDays, ClipboardList,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const nav = [
  { href: "/",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/trades",     label: "Trade Log",  icon: BookOpen },
  { href: "/trades/new", label: "New Trade",  icon: PlusCircle },
  { href: "/analytics",  label: "Analytics",  icon: BarChart2 },
  { href: "/calendar",   label: "Calendar",   icon: CalendarDays },
  { href: "/review",     label: "Review",     icon: ClipboardList },
  { href: "/playbook",   label: "Playbook",   icon: BookMarked },
  { href: "/risk",       label: "Risk",       icon: Shield },
];

interface SidebarProps { onNavigate?: () => void; }

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, logOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  return (
    <aside className="w-60 shrink-0 bg-[#0c0c0c] border-r border-[#1f1f1f] h-full min-h-screen flex flex-col">
      <div className="px-6 py-5 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <TrendingUp size={14} className="text-black" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">TradeLog</p>
            <p className="text-[10px] text-[#555] uppercase tracking-widest">Journal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href) && href !== "/trades/new");
          return (
            <Link key={href} href={href} onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-[#666] hover:text-[#ccc] hover:bg-[#161616]"
              }`}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[#1f1f1f] space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <User size={13} className="text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#ccc] truncate">{user?.displayName || "Trader"}</p>
            <p className="text-[10px] text-[#555] truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#555] hover:text-red-400 hover:bg-red-500/5 transition-all">
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  );
}
