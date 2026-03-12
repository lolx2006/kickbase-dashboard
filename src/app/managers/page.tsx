"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { kickbaseApi, type ManagerRanking } from "@/lib/kickbase-api";
import { AppShell } from "@/components/app-shell";
import { playerImageUrl, formatCurrency, formatPoints, positionLabel, positionColor, cn } from "@/lib/utils";
import { UserCircle, Loader2, X, Trophy, Banknote, TrendingUp } from "lucide-react";

interface PlayerDetail {
  i: string;
  fn?: string;
  ln?: string;
  n?: string;
  pos: number;
  mv?: number;
  ap?: number;
  g?: number;
  a?: number;
  pim?: string;
  tn?: string;
  tim?: string;
}

export default function ManagersPage() {
  const { selectedLeague } = useAuth();
  const [ranking, setRanking] = useState<ManagerRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const [managerPlayers, setManagerPlayers] = useState<PlayerDetail[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);

  const load = useCallback(async () => {
    if (!selectedLeague) return;
    setLoading(true);
    try {
      const data = await kickbaseApi.getLeagueRanking(selectedLeague.li);
      setRanking(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => { load(); }, [load]);

  const loadManagerPlayers = async (userId: string, playerIds: string[]) => {
    if (!selectedLeague) return;
    setSelectedManager(userId);
    setManagerPlayers([]);
    setPlayersLoading(true);
    try {
      const results = await Promise.all(
        playerIds.map((pid) =>
          kickbaseApi.request<PlayerDetail>(`/v4/leagues/${selectedLeague.li}/players/${pid}`).catch(() => null)
        )
      );
      setManagerPlayers(results.filter(Boolean) as PlayerDetail[]);
    } catch {
      // ignore
    } finally {
      setPlayersLoading(false);
    }
  };

  const manager = ranking?.us.find((u) => u.i === selectedManager);

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold flex items-center gap-2">
          <UserCircle className="h-6 w-6 text-purple-400" />
          Manager-Profile
        </h1>

        {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-400" /></div>}

        {!loading && ranking && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ranking.us.map((u) => (
              <div
                key={u.i}
                onClick={() => loadManagerPlayers(u.i, (u.lp || []).map(String))}
                className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-800/30 p-5 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    {u.uim ? (
                      <img src={playerImageUrl(u.uim)} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 text-lg font-bold">{u.n[0]}</div>
                    )}
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-emerald-400 border border-zinc-700">
                      {u.spl}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold">{u.n}</p>
                    <p className="text-xs text-zinc-500">{(u.lp || []).length} Spieler</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-[10px] text-zinc-500"><Trophy className="inline h-3 w-3" /> Punkte</p>
                    <p className="text-sm font-bold text-emerald-400">{formatPoints(u.sp)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-zinc-500"><TrendingUp className="inline h-3 w-3" /> Spieltag</p>
                    <p className="text-sm font-bold">{formatPoints(u.mdp)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-zinc-500"><Banknote className="inline h-3 w-3" /> Teamwert</p>
                    <p className="text-sm font-bold">{(u.tv / 1_000_000).toFixed(1)}M</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manager Detail Modal */}
        {selectedManager && manager && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl max-h-[90vh] overflow-y-auto">
              <button onClick={() => setSelectedManager(null)} className="absolute right-4 top-4 rounded-md p-1 text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  {manager.uim ? (
                    <img src={playerImageUrl(manager.uim)} alt="" className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-700 text-xl font-bold">{manager.n[0]}</div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{manager.n}</h2>
                    <p className="text-sm text-zinc-400">Platz {manager.spl} · {formatPoints(manager.sp)} Punkte · TV: {formatCurrency(manager.tv)}</p>
                  </div>
                </div>

                {playersLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-400" /></div>}

                {!playersLoading && managerPlayers.length > 0 && (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((pos) => {
                      const posPlayers = managerPlayers.filter((p) => p.pos === pos);
                      if (posPlayers.length === 0) return null;
                      return (
                        <div key={pos}>
                          <h3 className="mb-1 text-xs font-medium text-zinc-500">{positionLabel(pos)}</h3>
                          <div className="space-y-1">
                            {posPlayers.map((p) => (
                              <div key={p.i} className="flex items-center justify-between rounded-lg bg-zinc-800/40 px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white", positionColor(p.pos))}>
                                    {positionLabel(p.pos)}
                                  </span>
                                  {p.pim && <img src={playerImageUrl(p.pim)} alt="" className="h-6 w-6 rounded-full bg-zinc-700 object-cover" />}
                                  <span className="text-sm font-medium">{p.fn} {p.ln || p.n}</span>
                                  {p.tn && <span className="text-xs text-zinc-500">{p.tn}</span>}
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                  <span className="text-zinc-400">{formatPoints(p.ap)} Pkt</span>
                                  <span className="font-medium">{formatCurrency(p.mv)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between text-sm">
                      <span className="text-zinc-400">Gesamt-Marktwert</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(managerPlayers.reduce((s, p) => s + (p.mv || 0), 0))}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
