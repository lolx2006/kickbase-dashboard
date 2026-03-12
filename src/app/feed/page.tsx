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
import { Activity, RefreshCw, Loader2, ShoppingCart, Gavel } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function FeedPage() {
  const { selectedLeague } = useAuth();
  const [players, setPlayers] = useState<MarketPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFeed = useCallback(async () => {
    if (!selectedLeague) return;
    setLoading(true);
    setError("");
    try {
      const data = await kickbaseApi.getMarket(selectedLeague.li);
      setPlayers(data.it || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const groupByDate = (items: MarketPlayer[]) => {
    const groups: Record<string, MarketPlayer[]> = {};
    items.forEach((p) => {
      const dateKey = format(new Date(p.dt), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(p);
    });
    return Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
  };

  const grouped = groupByDate(players);

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-purple-400" />
              Liga-Feed
            </h1>
            <p className="text-sm text-zinc-400">
              Aktuelle Marktaktivitäten
            </p>
          </div>
          <button
            onClick={loadFeed}
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

        <div className="space-y-8">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <h3 className="mb-3 text-sm font-medium text-zinc-400">
                {format(new Date(date), "EEEE, dd. MMMM yyyy", { locale: de })}
              </h3>
              <div className="space-y-2">
                {items.map((p) => (
                  <div
                    key={p.i}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border p-4 transition-colors",
                      p.u
                        ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
                        : "border-zinc-800 bg-zinc-800/30 hover:border-zinc-700"
                    )}
                  >
                    <div className="relative">
                      <img
                        src={playerImageUrl(p.pim)}
                        alt=""
                        className="h-12 w-12 rounded-full bg-zinc-700 object-cover"
                      />
                      <div className={cn(
                        "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-white",
                        p.u ? "bg-amber-500" : "bg-emerald-500"
                      )}>
                        {p.u ? (
                          <Gavel className="h-3 w-3" />
                        ) : (
                          <ShoppingCart className="h-3 w-3" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{p.fn} {p.n}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold text-white",
                            positionColor(p.pos)
                          )}
                        >
                          {positionLabel(p.pos)}
                        </span>
                        {p.u && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                            <Gavel className="h-3 w-3" />
                            Gebot von {p.u.n}
                          </span>
                        )}
                        <span className="text-xs text-zinc-500">
                          {formatPoints(p.ap)} Pkt.
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Auf Markt seit {format(new Date(p.dt), "dd.MM.yy HH:mm", { locale: de })}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-bold",
                        p.u ? "text-amber-400" : "text-zinc-300"
                      )}>
                        {formatCurrency(p.mv)}
                      </p>
                      {p.u && (
                        <p className="text-[10px] font-medium text-amber-400/70 mt-0.5">
                          Gebot aktiv
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!players.length && !loading && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-12 text-center">
            <Activity className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-zinc-400">Keine Marktaktivitäten</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
