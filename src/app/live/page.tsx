"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { kickbaseApi, type ManagerRanking } from "@/lib/kickbase-api";
import { AppShell } from "@/components/app-shell";
import { formatPoints, formatCurrency, playerImageUrl, cn } from "@/lib/utils";
import { Zap, RefreshCw, Loader2, Clock, ChevronLeft, ChevronRight } from "lucide-react";

export default function LivePage() {
  const { selectedLeague } = useAuth();
  const [ranking, setRanking] = useState<ManagerRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [currentDay, setCurrentDay] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const loadLive = useCallback(async (day?: number) => {
    if (!selectedLeague) return;
    try {
      const data = await kickbaseApi.getLeagueRanking(selectedLeague.li, day);
      setRanking(data);
      if (currentDay === null) setCurrentDay(data.day);
      setLastUpdate(new Date());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, [selectedLeague, currentDay]);

  useEffect(() => {
    loadLive();
  }, [loadLive]);

  useEffect(() => {
    if (!autoRefresh || (selectedDay !== null && selectedDay !== currentDay)) return;
    const interval = setInterval(() => loadLive(selectedDay ?? undefined), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadLive, selectedDay, currentDay]);

  const isCurrentDay = selectedDay === null || selectedDay === currentDay;

  const goToDay = (day: number) => {
    if (day < 1 || day > 34) return;
    setLoading(true);
    setSelectedDay(day);
    loadLive(day);
  };

  const goToCurrent = () => {
    setLoading(true);
    setSelectedDay(null);
    loadLive();
  };

  const displayDay = selectedDay ?? ranking?.day ?? 0;

  const sorted = ranking?.us ? [...ranking.us].sort((a, b) => b.mdp - a.mdp) : [];

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-amber-400" />
              Spieltag {displayDay}
              {!isCurrentDay && (
                <span className="ml-2 rounded-md bg-zinc-700 px-2 py-0.5 text-xs font-normal text-zinc-400">
                  Vergangen
                </span>
              )}
            </h1>
            <p className="text-sm text-zinc-400">
              {lastUpdate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Letztes Update:{" "}
                  {lastUpdate.toLocaleTimeString("de-DE")}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isCurrentDay && (
              <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                />
                Auto-Refresh (30s)
              </label>
            )}
            <button
              onClick={() => loadLive(selectedDay ?? undefined)}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Matchday Navigation */}
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => goToDay(displayDay - 1)}
            disabled={displayDay <= 1 || loading}
            className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-1 overflow-x-auto py-1 scrollbar-none">
            {Array.from({ length: 34 }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                onClick={() => day === currentDay ? goToCurrent() : goToDay(day)}
                className={cn(
                  "min-w-[2rem] rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  day === displayDay
                    ? "bg-amber-500 text-black"
                    : day === currentDay
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                )}
              >
                {day}
              </button>
            ))}
          </div>
          <button
            onClick={() => goToDay(displayDay + 1)}
            disabled={displayDay >= 34 || loading}
            className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {!isCurrentDay && (
            <button
              onClick={goToCurrent}
              className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
            >
              Aktuell
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Matchday Ranking Cards */}
        <div className="space-y-3">
          {sorted.map((manager, idx) => (
            <div
              key={manager.i}
              className={cn(
                "rounded-xl border bg-zinc-800/30 p-4 transition-all",
                idx === 0
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-zinc-800"
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold",
                    idx === 0
                      ? "bg-amber-500/20 text-amber-400"
                      : idx === 1
                      ? "bg-zinc-400/20 text-zinc-300"
                      : idx === 2
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-zinc-800 text-zinc-500"
                  )}
                >
                  {idx + 1}
                </div>

                {manager.uim ? (
                  <img
                    src={playerImageUrl(manager.uim)}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold">
                    {manager.n?.[0]}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{manager.n}</p>
                  <p className="text-xs text-zinc-500">
                    Saison: {formatPoints(manager.sp)} Pkt. · Platz {manager.spl} · {formatCurrency(manager.tv)}
                  </p>
                </div>

                <div className="text-right">
                  <p className={cn(
                    "text-xl font-bold",
                    manager.mdp > 0 ? "text-emerald-400" : "text-zinc-400"
                  )}>
                    {formatPoints(manager.mdp)}
                  </p>
                  <p className="text-xs text-zinc-500">Spieltag-Pkt.</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!sorted.length && !loading && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-12 text-center">
            <Zap className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-zinc-400">Keine Spieltag-Daten verfügbar</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
