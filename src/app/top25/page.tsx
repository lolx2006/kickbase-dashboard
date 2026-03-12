"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { kickbaseApi, type MarketPlayer } from "@/lib/kickbase-api";
import { AppShell } from "@/components/app-shell";
import {
  formatCurrency,
  formatPoints,
  playerImageUrl,
  positionLabel,
  positionColor,
  cn,
} from "@/lib/utils";
import { TrendingUp, RefreshCw, Loader2, Crown } from "lucide-react";

export default function Top25Page() {
  const { selectedLeague } = useAuth();
  const [players, setPlayers] = useState<MarketPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTop25 = useCallback(async () => {
    if (!selectedLeague) return;
    setLoading(true);
    setError("");
    try {
      const data = await kickbaseApi.getMarket(selectedLeague.li);
      const sorted = (data.it || [])
        .filter((p) => p.ap > 0)
        .sort((a, b) => b.ap - a.ap)
        .slice(0, 25);
      setPlayers(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => {
    loadTop25();
  }, [loadTop25]);

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-amber-400" />
              Top Spieler auf dem Markt
            </h1>
            <p className="text-sm text-zinc-400">
              Die besten Spieler auf dem Transfermarkt nach Punkten
            </p>
          </div>
          <button
            onClick={loadTop25}
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player, idx) => (
            <div
              key={player.i}
              className={cn(
                "rounded-xl border bg-zinc-800/30 p-4 transition-all hover:border-zinc-600",
                idx === 0
                  ? "border-amber-500/40 bg-amber-500/5 sm:col-span-2 lg:col-span-3"
                  : idx < 3
                  ? "border-zinc-600"
                  : "border-zinc-800"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className={cn(
                      "absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      idx === 0
                        ? "bg-amber-500 text-black"
                        : idx === 1
                        ? "bg-zinc-300 text-black"
                        : idx === 2
                        ? "bg-orange-600 text-white"
                        : "bg-zinc-700 text-zinc-300"
                    )}
                  >
                    {idx + 1}
                  </div>
                  <img
                    src={playerImageUrl(player.pim)}
                    alt=""
                    className={cn(
                      "rounded-full bg-zinc-700 object-cover",
                      idx === 0 ? "h-16 w-16" : "h-12 w-12"
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("font-semibold truncate", idx === 0 && "text-lg")}>
                      {player.fn} {player.n}
                    </p>
                    {idx === 0 && (
                      <Crown className="h-5 w-5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold text-white",
                        positionColor(player.pos)
                      )}
                    >
                      {positionLabel(player.pos)}
                    </span>
                    {player.mv > 0 && (
                      <span className="text-xs text-zinc-500">
                        {formatCurrency(player.mv)}
                      </span>
                    )}
                    {player.u && (
                      <span className="text-xs text-zinc-500">
                        Gebot: {player.u.n}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={cn(
                      "font-bold text-emerald-400",
                      idx === 0 ? "text-2xl" : "text-lg"
                    )}
                  >
                    {formatPoints(player.ap)}
                  </p>
                  <p className="text-xs text-zinc-500">Punkte</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!players.length && !loading && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-12 text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-zinc-400">Keine Top-Spieler verfügbar</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
