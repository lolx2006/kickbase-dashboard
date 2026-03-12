"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { kickbaseApi } from "@/lib/kickbase-api";
import { AppShell } from "@/components/app-shell";
import { playerImageUrl, cn } from "@/lib/utils";
import { Trophy, RefreshCw, Loader2 } from "lucide-react";

interface TableTeam {
  tid: string;
  tn: string;
  il: boolean;
  mi: string;
  cp: number;
  cpl: number;
  pcpl: number;
  mc: number;
  gd: number;
  sp: number;
  tim: string;
}

export default function TablePage() {
  const { selectedLeague } = useAuth();
  const [teams, setTeams] = useState<TableTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTable = useCallback(async () => {
    if (!selectedLeague) return;
    setLoading(true);
    setError("");
    try {
      const data = await kickbaseApi.getCompetitionTable(selectedLeague.cpi);
      const rawTeams = (data as Record<string, unknown>).it;
      if (Array.isArray(rawTeams)) {
        setTeams((rawTeams as TableTeam[]).sort((a, b) => a.cpl - b.cpl));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => {
    loadTable();
  }, [loadTable]);

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-400" />
              Bundesliga-Tabelle
            </h1>
          </div>
          <button
            onClick={loadTable}
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

        <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="px-4 py-3 text-left font-medium w-8">#</th>
                  <th className="px-4 py-3 text-left font-medium">Team</th>
                  <th className="px-4 py-3 text-center font-medium">Sp</th>
                  <th className="px-4 py-3 text-center font-medium">Diff</th>
                  <th className="px-4 py-3 text-right font-medium">Pkt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {teams.map((team) => (
                  <tr
                    key={team.tid}
                    className={cn(
                      "hover:bg-zinc-800/30 transition-colors",
                      team.cpl <= 4 && "border-l-2 border-l-blue-500",
                      team.cpl >= 5 && team.cpl <= 6 && "border-l-2 border-l-orange-500",
                      team.cpl >= teams.length - 2 && "border-l-2 border-l-red-500"
                    )}
                  >
                    <td className="px-4 py-3 font-bold text-zinc-500">
                      {team.cpl}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {team.tim && (
                          <img
                            src={playerImageUrl(team.tim)}
                            alt=""
                            className="h-6 w-6"
                          />
                        )}
                        <span className="font-medium">{team.tn}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-400">
                      {team.mc}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-center font-medium",
                        team.gd > 0
                          ? "text-emerald-400"
                          : team.gd < 0
                          ? "text-red-400"
                          : "text-zinc-400"
                      )}
                    >
                      {team.gd > 0 ? `+${team.gd}` : team.gd}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-lg">
                      {team.cp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!teams.length && !loading && (
            <p className="py-12 text-center text-sm text-zinc-500">
              Keine Tabelle verfügbar
            </p>
          )}
        </div>

        {teams.length > 0 && (
          <div className="mt-4 flex items-center gap-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Champions League
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Europa League / Conference League
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Abstieg
            </span>
          </div>
        )}
      </div>
    </AppShell>
  );
}
