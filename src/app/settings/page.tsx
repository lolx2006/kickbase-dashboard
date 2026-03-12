"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { kickbaseApi } from "@/lib/kickbase-api";
import { AppShell } from "@/components/app-shell";
import { formatCurrency, formatPoints, cn } from "@/lib/utils";
import { Settings, Loader2, Trophy, Users, Banknote, TrendingUp } from "lucide-react";

interface LeagueSettings {
  i: string;
  lnm: string;
  mpst: number;
  mppu: number;
  amd: boolean;
  isp: boolean;
  gpm: number;
}

interface RankingUser {
  i: string;
  n: string;
  sp: number;
  tv: number;
  spl: number;
  uim?: string;
}

export default function SettingsPage() {
  const { selectedLeague } = useAuth();
  const [settings, setSettings] = useState<LeagueSettings | null>(null);
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!selectedLeague) return;
    setLoading(true);
    try {
      const [settingsData, rankingData] = await Promise.all([
        kickbaseApi.request<LeagueSettings>(`/v4/leagues/${selectedLeague.li}/settings`),
        kickbaseApi.getLeagueRanking(selectedLeague.li),
      ]);
      setSettings(settingsData);
      setUsers(rankingData.us);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => { load(); }, [load]);

  const mpstLabel = (v: number) => {
    switch (v) {
      case 1: return "Fester Preis";
      case 2: return "Marktwert";
      default: return `Modus ${v}`;
    }
  };

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-zinc-400" />
          Liga-Einstellungen
        </h1>

        {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-400" /></div>}

        {!loading && settings && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-5">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-medium">Liga-Name</span>
                </div>
                <p className="text-lg font-bold">{settings.lnm}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-5">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Max. Spieler pro Team</span>
                </div>
                <p className="text-lg font-bold">{settings.mppu}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-5">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <Banknote className="h-4 w-4" />
                  <span className="text-sm font-medium">Marktpreis-Modus</span>
                </div>
                <p className="text-lg font-bold">{mpstLabel(settings.mpst)}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-5">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Punkte pro Sieg</span>
                </div>
                <p className="text-lg font-bold">{settings.gpm}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-5">
                <p className="text-sm text-zinc-400 mb-2">Auto-Matchday</p>
                <p className={cn("text-lg font-bold", settings.amd ? "text-emerald-400" : "text-zinc-500")}>{settings.amd ? "Ja" : "Nein"}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-5">
                <p className="text-sm text-zinc-400 mb-2">Liga-ID</p>
                <p className="text-lg font-bold font-mono text-zinc-400">{settings.i}</p>
              </div>
            </div>

            {/* Liga-Statistiken */}
            <h2 className="text-lg font-semibold mb-4">Liga-Statistiken</h2>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 text-center">
                <p className="text-xs text-zinc-400">Manager</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 text-center">
                <p className="text-xs text-zinc-400">Gesamt-Punkte</p>
                <p className="text-2xl font-bold text-emerald-400">{formatPoints(users.reduce((s, u) => s + u.sp, 0))}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 text-center">
                <p className="text-xs text-zinc-400">Ø Punkte/Manager</p>
                <p className="text-2xl font-bold">{formatPoints(Math.round(users.reduce((s, u) => s + u.sp, 0) / (users.length || 1)))}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 text-center">
                <p className="text-xs text-zinc-400">Gesamt-Teamwert</p>
                <p className="text-2xl font-bold">{formatCurrency(users.reduce((s, u) => s + u.tv, 0))}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
