"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { kickbaseApi } from "@/lib/kickbase-api";
import { AppShell } from "@/components/app-shell";
import { playerImageUrl, formatCurrency, formatPoints, positionLabel, positionColor, cn } from "@/lib/utils";
import { Star, Loader2, Trash2, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

interface WatchlistEntry {
  i: string;
  fn?: string;
  ln?: string;
  n?: string;
  pos: number;
  mv?: number;
  pim?: string;
  addedAt: string;
}

interface PlayerLive {
  i: string;
  fn?: string;
  ln?: string;
  mv?: number;
  mvt?: number;
  ap?: number;
  tfhmvt?: number;
  st: number;
  prob?: number;
  tn?: string;
}

export default function WatchlistPage() {
  const { selectedLeague } = useAuth();
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [liveData, setLiveData] = useState<Record<string, PlayerLive>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("kb_watchlist") || "[]");
    setEntries(stored);
  }, []);

  const refresh = useCallback(async () => {
    if (!selectedLeague || entries.length === 0) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        entries.map((e) =>
          kickbaseApi.request<PlayerLive>(`/v4/leagues/${selectedLeague.li}/players/${e.i}`).catch(() => null)
        )
      );
      const map: Record<string, PlayerLive> = {};
      results.forEach((r) => { if (r) map[r.i] = r; });
      setLiveData(map);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedLeague, entries]);

  useEffect(() => { if (entries.length > 0) refresh(); }, [entries.length, selectedLeague, refresh]);

  const remove = (id: string) => {
    const updated = entries.filter((e) => e.i !== id);
    setEntries(updated);
    localStorage.setItem("kb_watchlist", JSON.stringify(updated));
  };

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-amber-400" />
            Watchlist
          </h1>
          <button onClick={refresh} disabled={loading} className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Aktualisieren
          </button>
        </div>

        {entries.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-12 text-center">
            <Star className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-zinc-400">Keine Spieler auf der Watchlist</p>
            <p className="text-xs text-zinc-600 mt-1">Füge Spieler über die Spieler-Suche oder den Transfermarkt hinzu</p>
          </div>
        )}

        {entries.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="px-4 py-3 text-left font-medium">Spieler</th>
                  <th className="px-4 py-3 text-left font-medium">Pos</th>
                  <th className="px-4 py-3 text-right font-medium">MW (gespeichert)</th>
                  <th className="px-4 py-3 text-right font-medium">MW (aktuell)</th>
                  <th className="px-4 py-3 text-right font-medium">Änderung</th>
                  <th className="px-4 py-3 text-right font-medium">MW heute</th>
                  <th className="px-4 py-3 text-right font-medium">Punkte</th>
                  <th className="px-4 py-3 text-center font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {entries.map((e) => {
                  const live = liveData[e.i];
                  const diff = live?.mv && e.mv ? live.mv - e.mv : null;
                  return (
                    <tr key={e.i} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {e.pim && <img src={playerImageUrl(e.pim)} alt="" className="h-8 w-8 rounded-full bg-zinc-700 object-cover" />}
                          <div>
                            <span className="font-medium">{e.fn} {e.ln || e.n}</span>
                            {live?.tn && <p className="text-xs text-zinc-500">{live.tn}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold text-white", positionColor(e.pos))}>
                          {positionLabel(e.pos)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-500">{formatCurrency(e.mv)}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {live ? (
                          <span className="inline-flex items-center gap-1">
                            {live.mvt === 1 && <TrendingUp className="h-3 w-3 text-emerald-400" />}
                            {live.mvt === 2 && <TrendingDown className="h-3 w-3 text-red-400" />}
                            {formatCurrency(live.mv)}
                          </span>
                        ) : "–"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {diff !== null && (
                          <span className={cn("text-xs font-medium", diff >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {live?.tfhmvt !== undefined && live.tfhmvt !== 0 && (
                          <span className={cn("text-xs", (live.tfhmvt ?? 0) > 0 ? "text-emerald-400" : "text-red-400")}>
                            {(live.tfhmvt ?? 0) > 0 ? "+" : ""}{formatCurrency(live.tfhmvt)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{live ? formatPoints(live.ap) : "–"}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => remove(e.i)} className="rounded p-1 text-zinc-500 hover:text-red-400 transition-colors" title="Entfernen">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
