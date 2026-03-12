"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { kickbaseApi, type LineupPlayer } from "@/lib/kickbase-api";
import { AppShell } from "@/components/app-shell";
import { playerImageUrl, formatCurrency, formatPoints, positionLabel, positionColor, cn } from "@/lib/utils";
import { Calculator, Loader2, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface PlayerWithDetail extends LineupPlayer {
  mv?: number;
  cv?: number;
  fn?: string;
  ln?: string;
  tn?: string;
  tfhmvt?: number;
  mvt?: number;
}

export default function CalculatorPage() {
  const { selectedLeague } = useAuth();
  const [players, setPlayers] = useState<PlayerWithDetail[]>([]);
  const [budget, setBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"profit" | "mv" | "name">("profit");

  const load = useCallback(async () => {
    if (!selectedLeague) return;
    setLoading(true);
    try {
      const [lineupData, meData] = await Promise.all([
        kickbaseApi.getLineup(selectedLeague.li),
        kickbaseApi.getLeagueMe(selectedLeague.li).catch(() => null),
      ]);
      if (meData) setBudget(meData.b);

      const details = await Promise.all(
        (lineupData.it || []).map((p) =>
          kickbaseApi.request<PlayerWithDetail>(`/v4/leagues/${selectedLeague.li}/players/${p.i}`)
            .then((d) => ({ ...p, ...d }))
            .catch(() => p as PlayerWithDetail)
        )
      );
      setPlayers(details);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...players].sort((a, b) => {
    if (sortBy === "profit") return ((b.mv ?? 0) - (b.cv ?? 0)) - ((a.mv ?? 0) - (a.cv ?? 0));
    if (sortBy === "mv") return (b.mv ?? 0) - (a.mv ?? 0);
    return (a.ln || a.n || "").localeCompare(b.ln || b.n || "");
  });

  const totalMv = players.reduce((s, p) => s + (p.mv ?? 0), 0);
  const totalCv = players.reduce((s, p) => s + (p.cv ?? 0), 0);
  const totalProfit = totalMv - totalCv;

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-6 w-6 text-violet-400" />
          Transfer-Kalkulator
        </h1>

        {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-400" /></div>}

        {!loading && (
          <>
            {/* Summary Cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 text-center">
                <p className="text-xs text-zinc-400">Kontostand</p>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(budget)}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 text-center">
                <p className="text-xs text-zinc-400">Aktueller Teamwert</p>
                <p className="text-lg font-bold text-white">{formatCurrency(totalMv)}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 text-center">
                <p className="text-xs text-zinc-400">Investiert (Kaufpreise)</p>
                <p className="text-lg font-bold text-zinc-300">{formatCurrency(totalCv)}</p>
              </div>
              <div className={cn("rounded-xl border p-4 text-center", totalProfit >= 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5")}>
                <p className="text-xs text-zinc-400">Gesamtgewinn</p>
                <p className={cn("text-lg font-bold", totalProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit)}
                </p>
              </div>
            </div>

            {/* Sort */}
            <div className="mb-4 flex gap-2">
              {([["profit", "Gewinn"], ["mv", "Marktwert"], ["name", "Name"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", sortBy === key ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white")}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Player Table */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="px-4 py-3 text-left font-medium">Spieler</th>
                    <th className="px-4 py-3 text-left font-medium">Pos</th>
                    <th className="px-4 py-3 text-right font-medium">Kaufpreis</th>
                    <th className="px-4 py-3 text-center font-medium"></th>
                    <th className="px-4 py-3 text-right font-medium">Marktwert</th>
                    <th className="px-4 py-3 text-right font-medium">Gewinn/Verlust</th>
                    <th className="px-4 py-3 text-right font-medium">MW heute</th>
                    <th className="px-4 py-3 text-right font-medium">Punkte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {sorted.map((p) => {
                    const profit = (p.mv ?? 0) - (p.cv ?? 0);
                    return (
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
                        <td className="px-4 py-3 text-right text-zinc-400">{formatCurrency(p.cv)}</td>
                        <td className="px-4 py-3 text-center"><ArrowRight className="h-3 w-3 text-zinc-600 mx-auto" /></td>
                        <td className="px-4 py-3 text-right font-medium">
                          <span className="inline-flex items-center gap-1">
                            {p.mvt === 1 && <TrendingUp className="h-3 w-3 text-emerald-400" />}
                            {p.mvt === 2 && <TrendingDown className="h-3 w-3 text-red-400" />}
                            {formatCurrency(p.mv)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn("font-medium", profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.tfhmvt !== undefined && p.tfhmvt !== 0 && (
                            <span className={cn("text-xs", (p.tfhmvt ?? 0) > 0 ? "text-emerald-400" : "text-red-400")}>
                              {(p.tfhmvt ?? 0) > 0 ? "+" : ""}{formatCurrency(p.tfhmvt)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-400">{formatPoints(p.ap)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
