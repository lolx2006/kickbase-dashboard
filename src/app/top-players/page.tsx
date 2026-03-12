"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { kickbaseApi } from "@/lib/kickbase-api";
import { AppShell } from "@/components/app-shell";
import { playerImageUrl, positionLabel, positionColor, cn } from "@/lib/utils";
import { Flame, Loader2 } from "lucide-react";

interface TopPlayer {
  pi: string;
  n: string;
  tid: string;
  mi: string;
  p: number;
  pos: number;
  il: boolean;
  st: number;
  mt: number;
  g: number;
  a: number;
  pes: number;
  cs: number;
  pim: string;
  ot?: { i: string; tim: string };
}

export default function TopPlayersPage() {
  const { selectedLeague } = useAuth();
  const [players, setPlayers] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!selectedLeague) return;
    setLoading(true);
    try {
      const data = await kickbaseApi.request<{ it: TopPlayer[] }>(`/v4/competitions/${selectedLeague.cpi}/players`);
      setPlayers(data.it || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => { load(); }, [load]);

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold flex items-center gap-2">
          <Flame className="h-6 w-6 text-orange-400" />
          Top-Spieler der Liga
        </h1>

        {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-400" /></div>}

        {!loading && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">Spieler</th>
                  <th className="px-4 py-3 text-left font-medium">Pos</th>
                  <th className="px-4 py-3 text-right font-medium">Punkte</th>
                  <th className="px-4 py-3 text-right font-medium">Tore</th>
                  <th className="px-4 py-3 text-right font-medium">Assists</th>
                  <th className="px-4 py-3 text-right font-medium">Minuten</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {players.map((p, i) => (
                  <tr key={p.pi} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-zinc-500">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={playerImageUrl(p.pim)} alt="" className="h-8 w-8 rounded-full bg-zinc-700 object-cover" />
                        <div>
                          <span className="font-medium">{p.n}</span>
                          {p.ot?.tim && <img src={playerImageUrl(p.ot.tim)} alt="" className="inline-block h-4 w-4 ml-2" />}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold text-white", positionColor(p.pos))}>
                        {positionLabel(p.pos)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">{p.p}</td>
                    <td className="px-4 py-3 text-right">{p.g}</td>
                    <td className="px-4 py-3 text-right">{p.a}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">{p.mt}</td>
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
