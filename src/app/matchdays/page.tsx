"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { kickbaseApi } from "@/lib/kickbase-api";
import { AppShell } from "@/components/app-shell";
import { playerImageUrl, formatPoints, positionLabel, positionColor, cn } from "@/lib/utils";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Loader2, Clock, MapPin } from "lucide-react";

interface Match {
  mi: string;
  day: number;
  dt: string;
  t1: string;
  t2: string;
  t1sy: string;
  t2sy: string;
  t1g: number;
  t2g: number;
  mtd: string;
  st: number;
  il: boolean;
  t1im: string;
  t2im: string;
}

interface Matchday {
  day: number;
  it: Match[];
}

interface MatchPlayer {
  i: string;
  fn: string;
  ln: string;
  pos: number;
  tp: number;
  mv: number;
  pim: string;
  g?: number;
  a?: number;
  r?: number;
  y?: number;
  sec?: number;
}

export default function MatchdaysPage() {
  const { selectedLeague } = useAuth();
  const [matchdays, setMatchdays] = useState<Matchday[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [matchPlayers, setMatchPlayers] = useState<{ t1: MatchPlayer[]; t2: MatchPlayer[] } | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  const TEAM_NAMES: Record<string, string> = {
    "2": "Bayern München", "3": "Bor. Dortmund", "4": "Bayer Leverkusen",
    "5": "RB Leipzig", "7": "VfB Stuttgart", "9": "Eintracht Frankfurt",
    "10": "VfL Wolfsburg", "11": "SC Freiburg", "13": "TSG Hoffenheim",
    "14": "Werder Bremen", "15": "Bor. M'gladbach", "18": "1. FC Union Berlin",
    "20": "FC Augsburg", "24": "1. FSV Mainz 05", "28": "VfL Bochum",
    "40": "FC St. Pauli", "43": "Holstein Kiel", "50": "1. FC Heidenheim",
  };

  const load = useCallback(async () => {
    if (!selectedLeague) return;
    setLoading(true);
    try {
      const data = await kickbaseApi.request<{ it: Matchday[] }>(`/v4/competitions/${selectedLeague.cpi}/matchdays`);
      setMatchdays(data.it || []);
      const current = data.it?.find((md) => md.it.some((m) => m.st === 1)) || data.it?.find((md) => md.it.some((m) => m.st === 2 && md.day >= 1));
      if (current) setCurrentDay(current.day);
      else {
        const latest = data.it?.filter((md) => md.it.some((m) => m.st === 2)).pop();
        if (latest) setCurrentDay(latest.day);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => { load(); }, [load]);

  const loadMatchDetail = async (match: Match) => {
    if (expandedMatch === match.mi) {
      setExpandedMatch(null);
      setMatchPlayers(null);
      return;
    }
    setExpandedMatch(match.mi);
    if (match.st === 0) { setMatchPlayers(null); return; }
    if (!selectedLeague) return;
    setMatchLoading(true);
    try {
      const players = await kickbaseApi.request<{ it: Array<{ i: string; fn: string; ln: string; tid: string; pos: number; tp: number; mv: number; pim: string; g?: number; a?: number; r?: number; y?: number; sec?: number }> }>(
        `/v4/competitions/${selectedLeague.cpi}/players`
      );
      const all = players.it || [];
      const t1p = all.filter((p) => p.tid === match.t1).sort((a, b) => b.tp - a.tp).slice(0, 11);
      const t2p = all.filter((p) => p.tid === match.t2).sort((a, b) => b.tp - a.tp).slice(0, 11);
      setMatchPlayers({ t1: t1p, t2: t2p });
    } catch {
      setMatchPlayers(null);
    } finally {
      setMatchLoading(false);
    }
  };

  const md = matchdays.find((m) => m.day === currentDay);

  const PlayerList = ({ players }: { players: MatchPlayer[] }) => (
    <div className="space-y-1">
      {players.map((p) => (
        <div key={p.i} className="flex items-center gap-2 rounded-md bg-zinc-800/50 px-2 py-1.5 text-xs">
          <img src={playerImageUrl(p.pim)} alt="" className="h-6 w-6 rounded-full bg-zinc-700 object-cover" />
          <span className={cn("w-8 text-center rounded px-1 py-0.5 text-[10px] font-bold text-white", positionColor(p.pos))}>
            {positionLabel(p.pos)}
          </span>
          <span className="flex-1 truncate font-medium">{p.fn?.[0]}. {p.ln}</span>
          {p.g ? <span className="text-emerald-400 font-bold">{p.g}⚽</span> : null}
          {p.a ? <span className="text-blue-400">{p.a}🅰</span> : null}
          {p.y ? <span className="text-yellow-400">🟡{p.y}</span> : null}
          {p.r ? <span className="text-red-400">🔴{p.r}</span> : null}
          <span className="text-zinc-400 w-12 text-right">{formatPoints(p.tp)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-400" />
            Spieltage
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDay(Math.max(1, currentDay - 1))} disabled={currentDay <= 1} className="rounded-lg bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              value={currentDay}
              onChange={(e) => setCurrentDay(Number(e.target.value))}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
            >
              {matchdays.map((m) => (
                <option key={m.day} value={m.day}>Spieltag {m.day}</option>
              ))}
            </select>
            <button onClick={() => setCurrentDay(Math.min(34, currentDay + 1))} disabled={currentDay >= 34} className="rounded-lg bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-400" /></div>
        )}

        {md && (
          <div className="space-y-3">
            {md.it.map((m) => {
              const isLive = m.st === 1;
              const isDone = m.st === 2;
              const date = new Date(m.dt);
              const isExpanded = expandedMatch === m.mi;
              return (
                <div
                  key={m.mi}
                  className={cn(
                    "rounded-xl border transition-colors overflow-hidden",
                    isLive ? "border-emerald-500/50 bg-emerald-500/5" : "border-zinc-800 bg-zinc-800/30"
                  )}
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/20 transition-colors"
                    onClick={() => loadMatchDetail(m)}
                  >
                    <span className="text-xs text-zinc-500 w-24">
                      {date.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}
                      {" "}
                      {date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className="flex items-center gap-4 flex-1 justify-center">
                      <div className="flex items-center gap-2 w-36 justify-end">
                        <span className="font-medium text-right">{m.t1sy}</span>
                        <img src={playerImageUrl(m.t1im)} alt="" className="h-7 w-7" />
                      </div>
                      <div className={cn(
                        "rounded-lg px-4 py-1.5 text-lg font-bold min-w-[70px] text-center",
                        isLive ? "bg-emerald-500/20 text-emerald-400" :
                        isDone ? "bg-zinc-700/50 text-white" :
                        "bg-zinc-800 text-zinc-500"
                      )}>
                        {isDone || isLive ? `${m.t1g}:${m.t2g}` : "–:–"}
                      </div>
                      <div className="flex items-center gap-2 w-36">
                        <img src={playerImageUrl(m.t2im)} alt="" className="h-7 w-7" />
                        <span className="font-medium">{m.t2sy}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-24 justify-end">
                      <span className={cn(
                        "text-xs",
                        isLive ? "text-emerald-400 font-bold" :
                        isDone ? "text-zinc-500" : "text-zinc-600"
                      )}>
                        {isLive ? `${m.mtd}'` : isDone ? "Beendet" : "Geplant"}
                      </span>
                      <ChevronDown className={cn("h-4 w-4 text-zinc-500 transition-transform", isExpanded && "rotate-180")} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-zinc-800 p-4">
                      <div className="mb-3 flex items-center justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <img src={playerImageUrl(m.t1im)} alt="" className="h-5 w-5" />
                          <span className="font-medium">{TEAM_NAMES[m.t1] || m.t1sy}</span>
                        </div>
                        <span className="text-zinc-500">vs</span>
                        <div className="flex items-center gap-2">
                          <img src={playerImageUrl(m.t2im)} alt="" className="h-5 w-5" />
                          <span className="font-medium">{TEAM_NAMES[m.t2] || m.t2sy}</span>
                        </div>
                      </div>
                      <div className="mb-4 flex items-center justify-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {date.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}, {date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Spieltag {m.day}</span>
                      </div>

                      {matchLoading && (
                        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
                      )}

                      {matchPlayers && !matchLoading && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="mb-2 flex items-center gap-2 text-xs font-bold text-zinc-300">
                              <img src={playerImageUrl(m.t1im)} alt="" className="h-4 w-4" />
                              {m.t1sy} – Top Spieler
                            </h4>
                            <PlayerList players={matchPlayers.t1} />
                          </div>
                          <div>
                            <h4 className="mb-2 flex items-center gap-2 text-xs font-bold text-zinc-300">
                              <img src={playerImageUrl(m.t2im)} alt="" className="h-4 w-4" />
                              {m.t2sy} – Top Spieler
                            </h4>
                            <PlayerList players={matchPlayers.t2} />
                          </div>
                        </div>
                      )}

                      {!matchPlayers && !matchLoading && m.st === 0 && (
                        <p className="text-center text-xs text-zinc-500 py-4">Spiel noch nicht gestartet</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
