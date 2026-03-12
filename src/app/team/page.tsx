"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { kickbaseApi, type LineupPlayer } from "@/lib/kickbase-api";
import { AppShell } from "@/components/app-shell";
import {
  formatPoints,
  formatCurrency,
  playerImageUrl,
  positionLabel,
  positionColor,
  statusLabel,
  cn,
} from "@/lib/utils";
import { Users, RefreshCw, Loader2, Home, Plane, CircleCheck, CircleHelp, CircleX, CircleMinus, Info, X } from "lucide-react";

function probLabel(prob: number): { text: string; color: string; icon: typeof CircleCheck } {
  switch (prob) {
    case 1: return { text: "Sicher", color: "text-emerald-400", icon: CircleCheck };
    case 2: return { text: "Wahrscheinlich", color: "text-green-400", icon: CircleCheck };
    case 3: return { text: "Vielleicht", color: "text-amber-400", icon: CircleHelp };
    case 4: return { text: "Eher nicht", color: "text-orange-400", icon: CircleMinus };
    case 5: return { text: "Nein", color: "text-red-400", icon: CircleX };
    default: return { text: "Unbekannt", color: "text-zinc-500", icon: CircleHelp };
  }
}

function PointsHistory({ ph }: { ph?: Array<{ hp: boolean; p?: number }> }) {
  if (!ph || ph.length === 0) return null;
  return (
    <div className="flex items-center gap-0.5">
      {ph.map((m, i) => (
        <span
          key={i}
          className={cn(
            "inline-flex items-center justify-center rounded text-[9px] font-bold w-7 h-5",
            !m.hp ? "bg-zinc-800 text-zinc-600" :
            (m.p ?? 0) >= 100 ? "bg-emerald-500/20 text-emerald-400" :
            (m.p ?? 0) >= 50 ? "bg-green-500/15 text-green-400" :
            (m.p ?? 0) >= 0 ? "bg-zinc-700/50 text-zinc-300" :
            "bg-red-500/15 text-red-400"
          )}
          title={m.hp ? `${m.p} Pkt` : "Nicht gespielt"}
        >
          {m.hp ? m.p : "–"}
        </span>
      ))}
    </div>
  );
}

interface PlayerDetail {
  mv?: number;
  cv?: number;
  tfhmvt?: number;
  tp?: number;
  g?: number;
  a?: number;
  y?: number;
  r?: number;
  sec?: number;
  stud?: number;
  fn?: string;
  ln?: string;
  tn?: string;
  mdsum?: Array<{ t1: string; t2: string; t1g: number; t2g: number; day: number; md: string; cur: boolean; t1im: string; t2im: string }>;
}

export default function TeamPage() {
  const { selectedLeague } = useAuth();
  const [lineup, setLineup] = useState<LineupPlayer[]>([]);
  const [bench, setBench] = useState<LineupPlayer[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<LineupPlayer | null>(null);
  const [playerDetail, setPlayerDetail] = useState<PlayerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadTeam = useCallback(async () => {
    if (!selectedLeague) return;
    setLoading(true);
    setError("");
    try {
      const data = await kickbaseApi.getLineup(selectedLeague.li);
      const players = data.it || [];
      const starters = players.filter((p) => p.lo !== undefined && p.lo !== null);
      const benchPlayers = players.filter((p) => p.lo === undefined || p.lo === null);
      setLineup(starters);
      setBench(benchPlayers);
      setTotalPoints(players.reduce((sum, p) => sum + (p.ap || 0), 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const openPlayerDetail = async (player: LineupPlayer) => {
    setSelectedPlayer(player);
    setPlayerDetail(null);
    setDetailLoading(true);
    if (!selectedLeague) return;
    try {
      const data = await kickbaseApi.request(`/v4/leagues/${selectedLeague.li}/players/${player.i}`);
      setPlayerDetail(data as PlayerDetail);
    } catch {
      // detail not available
    } finally {
      setDetailLoading(false);
    }
  };

  const groupByPosition = (players: LineupPlayer[]) => {
    const groups: Record<number, LineupPlayer[]> = { 1: [], 2: [], 3: [], 4: [] };
    players.forEach((p) => {
      if (groups[p.pos]) groups[p.pos].push(p);
    });
    return groups;
  };

  const grouped = groupByPosition(lineup);

  const PlayerCard = ({ player, dimmed = false }: { player: LineupPlayer; dimmed?: boolean }) => {
    const prob = probLabel(player.prob);
    const ProbIcon = prob.icon;
    return (
      <div
        onClick={() => openPlayerDetail(player)}
        className={cn(
          "cursor-pointer rounded-xl border p-4 transition-colors",
          dimmed
            ? "border-zinc-800/50 bg-zinc-800/15 hover:border-zinc-700"
            : "border-zinc-800 bg-zinc-800/30 hover:border-zinc-600"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={playerImageUrl(player.pim)}
              alt=""
              className={cn("h-12 w-12 rounded-full bg-zinc-700 object-cover", dimmed && "opacity-60")}
            />
            <span
              className={cn("absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center", prob.color)}
              title={`Einsatz: ${prob.text}`}
            >
              <ProbIcon className="h-4 w-4" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={cn("font-medium truncate", dimmed && "text-zinc-400")}>{player.n}</p>
              {dimmed && (
                <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold text-white", positionColor(player.pos))}>
                  {positionLabel(player.pos)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("text-xs", player.st === 0 ? "text-emerald-400" : "text-amber-400")}>
                {statusLabel(player.st)}
              </span>
              {player.os && (
                <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                  {player.ht ? <Home className="h-3 w-3" /> : <Plane className="h-3 w-3" />}
                  vs {player.os}
                </span>
              )}
              <span className="text-xs text-zinc-600">{formatPoints(player.ap)} Pkt</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={cn("text-[10px] font-medium", prob.color)}>{prob.text}</span>
            <Info className="h-3.5 w-3.5 text-zinc-600" />
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-zinc-800/50">
          <PointsHistory ph={player.ph} />
        </div>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-400" />
              Mein Team
            </h1>
            <p className="text-sm text-zinc-400">
              {lineup.length}/11 Spieler in der Aufstellung
              {bench.length > 0 && ` · ${bench.length} auf der Bank`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-zinc-400">Gesamtpunkte</p>
              <p className="text-xl font-bold text-emerald-400">
                {formatPoints(totalPoints)}
              </p>
            </div>
            <button
              onClick={loadTeam}
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

        {/* Legend */}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-[10px] text-zinc-500">
          <span className="font-medium text-zinc-400">Einsatz:</span>
          {[1, 2, 3, 4, 5].map((p) => {
            const info = probLabel(p);
            const Icon = info.icon;
            return (
              <span key={p} className={cn("inline-flex items-center gap-1", info.color)}>
                <Icon className="h-3 w-3" /> {info.text}
              </span>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Aufstellung */}
        <div className="mb-8 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Aufstellung
            <span className={cn(
              "text-sm font-normal",
              lineup.length === 11 ? "text-emerald-400" : "text-amber-400"
            )}>
              ({lineup.length}/11)
            </span>
          </h2>
          {[
            { pos: 1, label: "Torwart" },
            { pos: 2, label: "Abwehr" },
            { pos: 3, label: "Mittelfeld" },
            { pos: 4, label: "Sturm" },
          ].map(({ pos, label }) => (
            <div key={pos}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white",
                    positionColor(pos)
                  )}
                >
                  {positionLabel(pos)}
                </span>
                {label}
                <span className="text-zinc-600">
                  ({grouped[pos]?.length || 0})
                </span>
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {grouped[pos]?.map((player) => (
                  <PlayerCard key={player.i} player={player} />
                ))}
                {(!grouped[pos] || grouped[pos].length === 0) && (
                  <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-600">
                    Kein Spieler auf dieser Position
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bank */}
        {bench.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Ersatzbank
              <span className="text-sm font-normal text-zinc-500">
                ({bench.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {bench.map((player) => (
                <PlayerCard key={player.i} player={player} dimmed />
              ))}
            </div>
          </div>
        )}

        {!lineup.length && !bench.length && !loading && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-zinc-400">Keine Aufstellung gefunden</p>
          </div>
        )}

        {/* Player Detail Modal */}
        {selectedPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="absolute right-4 top-4 rounded-md p-1 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={playerImageUrl(selectedPlayer.pim)}
                    alt=""
                    className="h-16 w-16 rounded-full bg-zinc-700 object-cover"
                  />
                  <div>
                    <h2 className="text-xl font-bold">
                      {playerDetail?.fn || ""} {playerDetail?.ln || selectedPlayer.n}
                    </h2>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold text-white", positionColor(selectedPlayer.pos))}>
                        {positionLabel(selectedPlayer.pos)}
                      </span>
                      {playerDetail?.tn && (
                        <span className="text-sm text-zinc-400">{playerDetail.tn}</span>
                      )}
                      <span className={cn("text-xs", selectedPlayer.st === 0 ? "text-emerald-400" : "text-amber-400")}>
                        {statusLabel(selectedPlayer.st)}
                      </span>
                    </div>
                  </div>
                </div>

                {detailLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                  </div>
                )}

                {playerDetail && (
                  <>
                    {/* Stats Grid */}
                    <div className="mb-6 grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                        <p className="text-xs text-zinc-400">Marktwert</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(playerDetail.mv)}</p>
                      </div>
                      <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                        <p className="text-xs text-zinc-400">Kaufpreis</p>
                        <p className="text-lg font-bold text-zinc-300">{formatCurrency(playerDetail.cv)}</p>
                      </div>
                      <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                        <p className="text-xs text-zinc-400">Gewinn/Verlust</p>
                        <p className={cn("text-lg font-bold", (playerDetail.mv ?? 0) >= (playerDetail.cv ?? 0) ? "text-emerald-400" : "text-red-400")}>
                          {(playerDetail.mv ?? 0) >= (playerDetail.cv ?? 0) ? "+" : ""}{formatCurrency((playerDetail.mv ?? 0) - (playerDetail.cv ?? 0))}
                        </p>
                      </div>
                    </div>

                    {/* MW Change Today */}
                    {playerDetail.tfhmvt !== undefined && playerDetail.tfhmvt !== 0 && (
                      <div className={cn("mb-4 rounded-lg px-4 py-2 text-sm", playerDetail.tfhmvt > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                        MW-Änderung heute: {playerDetail.tfhmvt > 0 ? "+" : ""}{formatCurrency(playerDetail.tfhmvt)}
                      </div>
                    )}

                    {/* Performance Stats */}
                    <div className="mb-6 grid grid-cols-4 gap-2">
                      {[
                        { label: "Tore", value: playerDetail.g },
                        { label: "Assists", value: playerDetail.a },
                        { label: "Gelb", value: playerDetail.y },
                        { label: "Rot", value: playerDetail.r },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg bg-zinc-800/30 p-2 text-center">
                          <p className="text-[10px] text-zinc-500">{s.label}</p>
                          <p className="text-sm font-bold">{s.value ?? 0}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mb-6 grid grid-cols-3 gap-2">
                      {[
                        { label: "Punkte", value: formatPoints(selectedPlayer.ap) },
                        { label: "Startelf", value: String(playerDetail.stud ?? 0) },
                        { label: "Minuten", value: playerDetail.sec ? String(Math.round(playerDetail.sec / 60)) : "0" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg bg-zinc-800/30 p-2 text-center">
                          <p className="text-[10px] text-zinc-500">{s.label}</p>
                          <p className="text-sm font-bold">{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Points History */}
                    <div className="mb-6">
                      <h3 className="mb-2 text-sm font-medium text-zinc-300">Letzte 5 Spiele</h3>
                      <PointsHistory ph={selectedPlayer.ph} />
                    </div>

                    {/* Next Matches */}
                    {playerDetail.mdsum && playerDetail.mdsum.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-sm font-medium text-zinc-300">Nächste Spiele</h3>
                        <div className="space-y-2">
                          {playerDetail.mdsum.map((m) => (
                            <div
                              key={m.day}
                              className={cn(
                                "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                                m.cur ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-zinc-800/30"
                              )}
                            >
                              <span className="text-zinc-500">Spieltag {m.day}</span>
                              <div className="flex items-center gap-2">
                                <img src={playerImageUrl(m.t1im)} alt="" className="h-5 w-5" />
                                <span className="font-medium">{m.t1g}:{m.t2g}</span>
                                <img src={playerImageUrl(m.t2im)} alt="" className="h-5 w-5" />
                              </div>
                              <span className="text-xs text-zinc-500">
                                {new Date(m.md).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
