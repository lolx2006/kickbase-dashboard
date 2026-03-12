"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Trophy,
  Users,
  Zap,
  LogOut,
  ChevronDown,
  Calendar,
  LineChart,
  Star,
  Search,
  Settings,
  Calculator,
  Flame,
  UserCircle,
  ArrowRightLeft,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { cn, playerImageUrl } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/live", label: "Live-Spieltag", icon: Zap },
  { href: "/market", label: "Transfermarkt", icon: ShoppingCart },
  { href: "/team", label: "Mein Team", icon: Users },
  { href: "/matchdays", label: "Spieltage", icon: Calendar },
  { href: "/table", label: "Tabelle", icon: Trophy },
  { href: "/ranking", label: "Ranking-Verlauf", icon: LineChart },
  { href: "/top-players", label: "Top-Spieler", icon: Flame },
  { href: "/managers", label: "Manager", icon: UserCircle },
  { href: "/search", label: "Spieler-Suche", icon: Search },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/calculator", label: "Transfer-Kalkulator", icon: Calculator },
  { href: "/transfers", label: "Transfer-Log", icon: ArrowRightLeft },
  { href: "/settings", label: "Liga-Einstellungen", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, leagues, selectedLeague, selectLeague, logout } = useAuth();
  const [leagueOpen, setLeagueOpen] = useState(false);

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-bold text-lg">
          KB
        </div>
        <div>
          <h1 className="text-sm font-bold">Kickbase</h1>
          <p className="text-xs text-zinc-400">Web Client</p>
        </div>
      </div>

      {/* League Selector */}
      {selectedLeague && (
        <div className="border-b border-zinc-800 px-3 py-3">
          <button
            onClick={() => setLeagueOpen(!leagueOpen)}
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-zinc-800/50 transition-colors"
          >
            <span className="font-medium truncate">{selectedLeague.lnm}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-zinc-400 transition-transform",
                leagueOpen && "rotate-180"
              )}
            />
          </button>
          {leagueOpen && (
            <div className="mt-1 space-y-0.5">
              {leagues.map((l) => (
                <button
                  key={l.li}
                  onClick={() => {
                    selectLeague(l);
                    setLeagueOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors",
                    l.li === selectedLeague.li
                      ? "bg-emerald-600/20 text-emerald-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  )}
                >
                  {l.lnm}
                  <span className="ml-1 text-zinc-500">
                    ({l.mgc}/{l.mgm})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-600/15 text-emerald-400"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="border-t border-zinc-800 px-3 py-3">
          <div className="flex items-center gap-3 px-2">
            {user.uim ? (
              <img
                src={playerImageUrl(user.uim)}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">
                {user.name?.[0] || "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-zinc-500">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Abmelden"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
