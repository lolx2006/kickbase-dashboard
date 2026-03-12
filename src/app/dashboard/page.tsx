"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import {
  kickbaseApi,
  type ManagerRanking,
  type LeagueMeResponse,
  type MarketResponse,
} from "@/lib/kickbase-api";
import { AppShell } from "@/components/app-shell";
import { formatCurrency, formatPoints, playerImageUrl } from "@/lib/utils";
import {
  Trophy,
  TrendingUp,
  Users,
  Wallet,
  RefreshCw,
  Loader2,
  ShoppingCart,
} from "lucide-react";

export default function DashboardPage() {
  const { selectedLeague, user } = useAuth();
  const [ranking, setRanking] = useState<ManagerRanking | null>(null);
  const [leagueMe, setLeagueMe] = useState<LeagueMeResponse | null>(null);
  const [market, setMarket] = useState<MarketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!selectedLeague) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [rankingData, meData, marketData] = await Promise.all([
        kickbaseApi.getLeagueRanking(selectedLeague.li).catch(() => null),
        kickbaseApi.getLeagueMe(selectedLeague.li).catch(() => null),
        kickbaseApi.getMarket(selectedLeague.li).catch(() => null),
      ]);
      if (rankingData) setRanking(rankingData);
      if (meData) setLeagueMe(meData);
      if (marketData) setMarket(marketData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const myRank = ranking?.us?.find((u) => u.i === user?.id);
  const sortedBySeason = ranking?.us ? [...ranking.us].sort((a, b) => a.spl - b.spl) : [];

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-zinc-400">{selectedLeague?.lnm}</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Aktualisieren
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/15">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Manager</p>
                <p className="text-xl font-bold">{leagueMe?.mgc || selectedLeague?.mgc || 0}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/15">
                <Trophy className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Mein Platz (Saison)</p>
                <p className="text-xl font-bold">{myRank?.spl || "-"}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600/15">
                <Wallet className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Budget</p>
                <p className="text-xl font-bold">
                  {leagueMe ? formatCurrency(leagueMe.b) : "-"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/15">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Teamwert</p>
                <p className="text-xl font-bold">
                  {myRank ? formatCurrency(myRank.tv) : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Season Ranking */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-emerald-400" />
                Saison-Ranking
                {ranking?.day && (
                  <span className="text-xs text-zinc-500 font-normal">Spieltag {ranking.day}</span>
                )}
              </h2>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {sortedBySeason.map((manager) => (
                <div
                  key={manager.i}
                  className={`flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/20 transition-colors ${
                    manager.i === user?.id ? "bg-emerald-500/5" : ""
                  }`}
                >
                  <span className="w-6 text-center text-sm font-bold text-zinc-500">
                    {manager.spl}
                  </span>
                  {manager.uim ? (
                    <img
                      src={playerImageUrl(manager.uim)}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">
                      {manager.n?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{manager.n}</p>
                    <p className="text-xs text-zinc-500">
                      {formatCurrency(manager.tv)} · ST {formatPoints(manager.mdp)} Pkt.
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">
                    {formatPoints(manager.sp)} Pkt.
                  </span>
                </div>
              ))}
              {!ranking?.us?.length && !loading && (
                <p className="px-5 py-8 text-center text-sm text-zinc-500">
                  Keine Ranking-Daten verfügbar
                </p>
              )}
            </div>
          </div>

          {/* Market Overview */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h2 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-400" />
                Transfermarkt
                {market?.it && (
                  <span className="text-xs text-zinc-500 font-normal">{market.it.length} Spieler</span>
                )}
              </h2>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {market?.it?.slice(0, 10).map((player) => (
                <div
                  key={player.i}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/20 transition-colors"
                >
                  <img
                    src={playerImageUrl(player.pim)}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover bg-zinc-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{player.fn} {player.n}</p>
                    <p className="text-xs text-zinc-500">
                      {player.u ? `Gebot von ${player.u.n}` : "Kein Gebot"}
                      {player.ap ? ` · ${formatPoints(player.ap)} Pkt.` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-amber-400">
                    {formatCurrency(player.mv)}
                  </span>
                </div>
              ))}
              {!market?.it?.length && !loading && (
                <p className="px-5 py-8 text-center text-sm text-zinc-500">
                  Kein Spieler auf dem Markt
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
