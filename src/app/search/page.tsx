"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { kickbaseApi } from "@/lib/kickbase-api";
import { AppShell } from "@/components/app-shell";
import { playerImageUrl, formatCurrency, formatPoints, positionLabel, positionColor, statusLabel, cn } from "@/lib/utils";
import { Search, Loader2, Star, TrendingUp, TrendingDown } from "lucide-react";

interface PlayerResult {
  i: string;
  fn?: string;
  ln?: string;
  n?: string;
  pos: number;
  mv?: number;
  mvt?: number;
  ap?: number;
  g?: number;
  a?: number;
  st: number;
  pim?: string;
  tn?: string;
  oui?: string;
  cv?: number;
  prob?: number;
  tfhmvt?: number;
}

export default function SearchPage() {
  const { selectedLeague } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!selectedLeague || !query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const market = await kickbaseApi.getMarket(selectedLeague.li);
      const q = query.toLowerCase();
      const marketMatches = (market.it || []).filter((p) =>
        `${p.fn} ${p.n}`.toLowerCase().includes(q)
      );

      const playerDetails: PlayerResult[] = await Promise.all(
        marketMatches.slice(0, 20).map((mp) =>
          kickbaseApi.request<PlayerResult>(`/v4/leagues/${selectedLeague.li}/players/${mp.i}`).catch(() => ({
            i: mp.i, fn: mp.fn, n: mp.n, pos: mp.pos, mv: mp.mv, ap: mp.ap, st: mp.st, pim: mp.pim, mvt: mp.mvt,
          } as PlayerResult))
        )
      );
      setResults(playerDetails);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = (player: PlayerResult) => {
    const stored = JSON.parse(localStorage.getItem("kb_watchlist") || "[]");
    if (!stored.find((p: { i: string }) => p.i === player.i)) {
      stored.push({ i: player.i, fn: player.fn, ln: player.ln, n: player.n, pos: player.pos, mv: player.mv, pim: player.pim, addedAt: new Date().toISOString() });
      localStorage.setItem("kb_watchlist", JSON.stringify(stored));
    }
  };

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold flex items-center gap-2">
          <Search className="h-6 w-6 text-cyan-400" />
          Spieler-Suche
        </h1>

        <div className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="Spielername eingeben..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
          <button onClick={search} disabled={loading} className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suchen"}
          </button>
        </div>

        <p className="mb-4 text-xs text-zinc-500">Sucht Spieler auf dem aktuellen Transfermarkt. Klicke ⭐ um Spieler zur Watchlist hinzuzufügen.</p>

        {!loading && searched && results.length === 0 && (
          <p className="text-center text-sm text-zinc-500 py-12">Keine Spieler gefunden</p>
        )}

        {results.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="px-4 py-3 text-left font-medium">Spieler</th>
                  <th className="px-4 py-3 text-left font-medium">Pos</th>
                  <th className="px-4 py-3 text-right font-medium">Marktwert</th>
                  <th className="px-4 py-3 text-right font-medium">Punkte</th>
                  <th className="px-4 py-3 text-right font-medium">Tore/Assists</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">MW Heute</th>
                  <th className="px-4 py-3 text-center font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {results.map((p) => (
                  <tr key={p.i} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.pim && <img src={playerImageUrl(p.pim)} alt="" className="h-8 w-8 rounded-full bg-zinc-700 object-cover" />}
                        <div>
                          <span className="font-medium">{p.fn} {p.ln || p.n}</span>
                          {p.tn && <p className="text-xs text-zinc-500">{p.tn}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold text-white", positionColor(p.pos))}>
                        {positionLabel(p.pos)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span className="inline-flex items-center gap-1">
                        {p.mvt === 1 && <TrendingUp className="h-3 w-3 text-emerald-400" />}
                        {p.mvt === 2 && <TrendingDown className="h-3 w-3 text-red-400" />}
                        {formatCurrency(p.mv)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{formatPoints(p.ap)}</td>
                    <td className="px-4 py-3 text-right">{p.g ?? 0}/{p.a ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("text-xs", p.st === 0 ? "text-emerald-400" : "text-amber-400")}>{statusLabel(p.st)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.tfhmvt !== undefined && p.tfhmvt !== 0 && (
                        <span className={cn("text-xs font-medium", (p.tfhmvt ?? 0) > 0 ? "text-emerald-400" : "text-red-400")}>
                          {(p.tfhmvt ?? 0) > 0 ? "+" : ""}{formatCurrency(p.tfhmvt)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => addToWatchlist(p)} className="rounded p-1 text-zinc-500 hover:text-amber-400 transition-colors" title="Zur Watchlist">
                        <Star className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
