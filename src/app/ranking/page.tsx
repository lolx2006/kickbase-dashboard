"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { kickbaseApi } from "@/lib/kickbase-api";
import { AppShell } from "@/components/app-shell";
import { playerImageUrl, cn, formatPoints } from "@/lib/utils";
import { LineChart as LineChartIcon, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#6366f1"];

interface RankingUser {
  i: string;
  n: string;
  sp: number;
  mdp: number;
  tv: number;
  spl: number;
  mdpl: number;
  uim?: string;
}

export default function RankingPage() {
  const { selectedLeague } = useAuth();
  const [chartData, setChartData] = useState<Record<string, unknown>[]>([]);
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"points" | "place">("points");

  const load = useCallback(async () => {
    if (!selectedLeague) return;
    setLoading(true);
    try {
      const current = await kickbaseApi.getLeagueRanking(selectedLeague.li);
      const currentDay = current.day || 25;
      setUsers(current.us);

      const promises: Promise<{ day: number; us: RankingUser[] }>[] = [];
      for (let d = 1; d <= currentDay; d++) {
        promises.push(
          kickbaseApi.getLeagueRanking(selectedLeague.li, d).then((r) => ({ day: d, us: r.us })).catch(() => ({ day: d, us: [] }))
        );
      }
      const results = await Promise.all(promises);

      const data = results.map((r) => {
        const point: Record<string, unknown> = { day: `ST ${r.day}` };
        r.us.forEach((u) => {
          point[`${u.n}_sp`] = u.sp;
          point[`${u.n}_pl`] = u.spl;
        });
        return point;
      });
      setChartData(data);
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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LineChartIcon className="h-6 w-6 text-blue-400" />
            Ranking-Verlauf
          </h1>
          <div className="flex gap-2">
            {(["points", "place"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", mode === m ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white")}
              >
                {m === "points" ? "Punkte" : "Platzierung"}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <p className="text-sm text-zinc-500">Lade Ranking-Daten aller Spieltage...</p>
          </div>
        )}

        {!loading && chartData.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 11 }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} reversed={mode === "place"} domain={mode === "place" ? [1, users.length] : undefined} />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }} labelStyle={{ color: "#a1a1aa" }} />
                <Legend />
                {users.map((u, i) => (
                  <Line
                    key={u.i}
                    type="monotone"
                    dataKey={mode === "points" ? `${u.n}_sp` : `${u.n}_pl`}
                    name={u.n}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Current Standing Table */}
        {!loading && users.length > 0 && (
          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-800/30 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">Manager</th>
                  <th className="px-4 py-3 text-right font-medium">Punkte</th>
                  <th className="px-4 py-3 text-right font-medium">Spieltag</th>
                  <th className="px-4 py-3 text-right font-medium">Teamwert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {[...users].sort((a, b) => a.spl - b.spl).map((u) => {
                  const colorIdx = users.findIndex((x) => x.i === u.i);
                  return (
                  <tr key={u.i} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 font-bold" style={{ color: COLORS[colorIdx % COLORS.length] }}>{u.spl}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.uim && <img src={playerImageUrl(u.uim)} alt="" className="h-6 w-6 rounded-full" />}
                        <span className="font-medium">{u.n}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatPoints(u.sp)}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">{formatPoints(u.mdp)}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">{(u.tv / 1_000_000).toFixed(1)}M €</td>
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
