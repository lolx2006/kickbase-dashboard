"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { kickbaseApi, type MarketPlayer, type MarketValueResponse, type LeagueMeResponse, type LineupPlayer, type TransferHistoryItem } from "@/lib/kickbase-api";
import { AppShell } from "@/components/app-shell";
import {
  formatCurrency,
  formatPoints,
  playerImageUrl,
  positionLabel,
  positionColor,
  statusLabel,
  cn,
} from "@/lib/utils";
import {
  ShoppingCart,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Filter,
  Wallet,
  Tag,
  Banknote,
  CircleCheck,
  CircleHelp,
  CircleX,
  CircleMinus,
  Gavel,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type SortKey = "mv" | "ap" | "pos" | "n" | "exs";
type SortDir = "asc" | "desc";

export default function MarketPage() {
  const { selectedLeague, user } = useAuth();
  const [players, setPlayers] = useState<MarketPlayer[]>([]);
  const [filtered, setFiltered] = useState<MarketPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("mv");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedPlayer, setSelectedPlayer] = useState<MarketPlayer | null>(null);
  const [mvData, setMvData] = useState<MarketValueResponse | null>(null);
  const [mvLoading, setMvLoading] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidStatus, setBidStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [budget, setBudget] = useState<LeagueMeResponse | null>(null);
  const [myPlayers, setMyPlayers] = useState<LineupPlayer[]>([]);
  const [sellPrice, setSellPrice] = useState("");
  const [sellStatus, setSellStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"market" | "sell">("market");
  const [teamValue, setTeamValue] = useState<number>(0);
  const [bargainOnly, setBargainOnly] = useState(false);
  const [transferHistory, setTransferHistory] = useState<TransferHistoryItem[]>([]);
  const [thLoading, setThLoading] = useState(false);

  const loadMarket = useCallback(async () => {
    if (!selectedLeague) return;
    setLoading(true);
    setError("");
    try {
      const [marketData, meData, lineupData, rankingData] = await Promise.all([
        kickbaseApi.getMarket(selectedLeague.li),
        kickbaseApi.getLeagueMe(selectedLeague.li).catch(() => null),
        kickbaseApi.getLineup(selectedLeague.li).catch(() => null),
        kickbaseApi.getLeagueRanking(selectedLeague.li).catch(() => null),
      ]);
      setPlayers(marketData.it || []);
      if (meData) setBudget(meData);
      if (lineupData) setMyPlayers(lineupData.it || []);
      if (rankingData && user) {
        const me = rankingData.us.find((u) => u.i === user.id);
        if (me) setTeamValue(me.tv);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, [selectedLeague, user]);

  useEffect(() => {
    loadMarket();
  }, [loadMarket]);

  useEffect(() => {
    let result = [...players];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => `${p.fn} ${p.n}`.toLowerCase().includes(q));
    }
    if (posFilter !== null) {
      result = result.filter((p) => p.pos === posFilter);
    }
    if (bargainOnly) {
      result = result.filter((p) => p.p && p.mv && p.p < p.mv);
    }
    result.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (typeof valA === "string" && typeof valB === "string") {
        return sortDir === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return sortDir === "asc" ? numA - numB : numB - numA;
    });
    setFiltered(result);
  }, [players, search, posFilter, sortKey, sortDir, bargainOnly]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "n" ? "asc" : "desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  const openPlayerDetail = async (player: MarketPlayer) => {
    setSelectedPlayer(player);
    setMvData(null);
    setBidStatus(null);
    setBidAmount(player.mv ? String(player.mv) : "");
    if (!selectedLeague) return;
    setMvLoading(true);
    setThLoading(true);
    setTransferHistory([]);
    try {
      const data = await kickbaseApi.getPlayerMarketValue(
        selectedLeague.li,
        player.i,
        92
      );
      setMvData(data);
    } catch {
      // Market value not available
    } finally {
      setMvLoading(false);
    }
    try {
      const th = await kickbaseApi.request<{ it: TransferHistoryItem[] }>(
        `/v4/leagues/${selectedLeague.li}/players/${player.i}/transferhistory`
      );
      setTransferHistory(th.it || []);
    } catch {
      // Transfer history not available
    } finally {
      setThLoading(false);
    }
  };

  const placeBid = async () => {
    if (!selectedLeague || !selectedPlayer || !bidAmount) return;
    setBidStatus(null);
    try {
      await kickbaseApi.placeOffer(
        selectedLeague.li,
        selectedPlayer.i,
        Number(bidAmount)
      );
      setBidStatus({ type: "success", msg: "Gebot erfolgreich abgegeben!" });
      loadMarket();
    } catch (err) {
      setBidStatus({
        type: "error",
        msg: err instanceof Error ? err.message : "Gebot fehlgeschlagen",
      });
    }
  };

  const myBidsTotal = players
    .filter((p) => p.ofc > 0 && p.uop)
    .reduce((sum, p) => sum + (p.uop || 0), 0);
  const myBidsCount = players.filter((p) => p.ofc > 0).length;

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-emerald-400" />
              Transfermarkt
            </h1>
            <p className="text-sm text-zinc-400">
              {players.length} Spieler auf dem Markt
            </p>
          </div>
          <button
            onClick={loadMarket}
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

        {/* Budget Cards */}
        {budget && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Wallet className="h-4 w-4" />
                <span className="text-xs">Kontostand</span>
              </div>
              <p className="text-xl font-bold text-emerald-400">
                {formatCurrency(budget.b)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Banknote className="h-4 w-4" />
                <span className="text-xs">Teamwert</span>
              </div>
              <p className="text-xl font-bold text-white">
                {formatCurrency(teamValue)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-xs">Gesamtvermögen</span>
              </div>
              <p className="text-xl font-bold text-emerald-400">
                {formatCurrency(budget.b + teamValue)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Tag className="h-4 w-4" />
                <span className="text-xs">Spieler</span>
              </div>
              <p className="text-xl font-bold text-white">
                {myPlayers.length}
              </p>
            </div>
            {myBidsCount > 0 && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                <div className="flex items-center gap-2 text-zinc-400 mb-1">
                  <Gavel className="h-4 w-4 text-blue-400" />
                  <span className="text-xs">Geboten ({myBidsCount})</span>
                </div>
                <p className="text-xl font-bold text-blue-400">
                  {formatCurrency(myBidsTotal)}
                </p>
              </div>
            )}
            {myBidsCount > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                <div className="flex items-center gap-2 text-zinc-400 mb-1">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs">Verfügbar</span>
                </div>
                <p className="text-xl font-bold text-amber-400">
                  {formatCurrency(budget.b - myBidsTotal)}
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTab("market")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === "market" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            Transfermarkt ({players.length})
          </button>
          <button
            onClick={() => setTab("sell")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === "sell" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            Spieler verkaufen ({myPlayers.length})
          </button>
        </div>

        {/* Filters */}
        {tab === "market" && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Spieler suchen..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 pl-10 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-zinc-500" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-zinc-500 mr-1" />
              {[
                { val: null, label: "Alle" },
                { val: 1, label: "TW" },
                { val: 2, label: "ABW" },
                { val: 3, label: "MF" },
                { val: 4, label: "ST" },
              ].map((f) => (
                <button
                  key={String(f.val)}
                  onClick={() => setPosFilter(f.val)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    posFilter === f.val
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setBargainOnly(!bargainOnly)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                bargainOnly ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
              )}
            >
              💰 Schnäppchen
            </button>
          </div>
        )}

        {/* Player Table */}
        {tab === "market" && <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="px-4 py-3 text-left font-medium">
                    <button
                      onClick={() => toggleSort("exs")}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      # <SortIcon col="exs" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    <button
                      onClick={() => toggleSort("n")}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      Spieler <SortIcon col="n" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    <button
                      onClick={() => toggleSort("pos")}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      Pos <SortIcon col="pos" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    <button
                      onClick={() => toggleSort("mv")}
                      className="flex items-center gap-1 justify-end hover:text-white"
                    >
                      Marktwert <SortIcon col="mv" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    <button
                      onClick={() => toggleSort("ap")}
                      className="flex items-center gap-1 justify-end hover:text-white"
                    >
                      Punkte <SortIcon col="ap" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Einsatz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filtered.map((p) => (
                  <tr
                    key={p.i}
                    onClick={() => openPlayerDetail(p)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      p.ofc > 0
                        ? "bg-blue-500/5 hover:bg-blue-500/10 border-l-2 border-l-blue-500"
                        : p.u
                          ? "bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-l-amber-500"
                          : "hover:bg-zinc-800/30"
                    )}
                  >
                    <td className="px-4 py-3 text-zinc-500">{p.exs ? Math.round(p.exs / 3600) + 'h' : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={playerImageUrl(p.pim)}
                          alt=""
                          className="h-8 w-8 rounded-full bg-zinc-700 object-cover"
                        />
                        <div>
                          <span className="font-medium">{p.fn} {p.n}</span>
                          {p.ofc > 0 && p.uop && (
                            <p className="inline-flex items-center gap-1 rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-400 mt-0.5">
                              Dein Gebot: {formatCurrency(p.uop)}
                            </p>
                          )}
                          {p.u && p.ofc === 0 && (
                            <p className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 mt-0.5">
                              Gebot: {p.u.n} ({formatCurrency(p.p)})
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold text-white",
                          positionColor(p.pos)
                        )}
                      >
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
                    <td className="px-4 py-3 text-right">
                      {formatPoints(p.ap)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "text-xs",
                          p.st === 0 ? "text-emerald-400" : "text-amber-400"
                        )}
                      >
                        {statusLabel(p.st)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span title={p.prob === 1 ? "Sicher" : p.prob === 2 ? "Wahrscheinlich" : p.prob === 3 ? "Vielleicht" : p.prob === 4 ? "Eher nicht" : p.prob === 5 ? "Nein" : ""}>
                        {p.prob === 1 && <CircleCheck className="h-4 w-4 text-emerald-400 mx-auto" />}
                        {p.prob === 2 && <CircleCheck className="h-4 w-4 text-green-400 mx-auto" />}
                        {p.prob === 3 && <CircleHelp className="h-4 w-4 text-amber-400 mx-auto" />}
                        {p.prob === 4 && <CircleMinus className="h-4 w-4 text-orange-400 mx-auto" />}
                        {p.prob === 5 && <CircleX className="h-4 w-4 text-red-400 mx-auto" />}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && !loading && (
            <p className="py-12 text-center text-sm text-zinc-500">
              Keine Spieler gefunden
            </p>
          )}
        </div>}

        {/* Sell Tab */}
        {tab === "sell" && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 overflow-hidden">
            {sellStatus && (
              <div className={cn("px-4 py-3 text-sm border-b border-zinc-800", sellStatus.type === "success" ? "text-emerald-400 bg-emerald-500/5" : "text-red-400 bg-red-500/5")}>
                {sellStatus.msg}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="px-4 py-3 text-left font-medium">Spieler</th>
                    <th className="px-4 py-3 text-left font-medium">Pos</th>
                    <th className="px-4 py-3 text-right font-medium">Marktwert</th>
                    <th className="px-4 py-3 text-right font-medium">Punkte</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {myPlayers.map((p) => {
                    const marketEntry = players.find((mp) => mp.i === p.i);
                    const isOnMarket = !!marketEntry;
                    const playerMv = marketEntry?.mv;
                    return (
                      <tr
                        key={p.i}
                        className={cn(
                          "transition-colors",
                          isOnMarket
                            ? "bg-amber-500/5 border-l-2 border-l-amber-500"
                            : "hover:bg-zinc-800/30"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={playerImageUrl(p.pim)}
                              alt=""
                              className="h-8 w-8 rounded-full bg-zinc-700 object-cover"
                            />
                            <div>
                              <span className="font-medium">{p.n}</span>
                              {isOnMarket && (
                                <p className="text-[10px] text-amber-400 font-medium">Auf dem Markt</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold text-white", positionColor(p.pos))}>
                            {positionLabel(p.pos)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {playerMv ? formatCurrency(playerMv) : "–"}
                        </td>
                        <td className="px-4 py-3 text-right">{formatPoints(p.ap)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("text-xs", p.st === 0 ? "text-emerald-400" : "text-amber-400")}>
                            {statusLabel(p.st)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isOnMarket ? (
                            <div className="flex flex-col items-end gap-1">
                              {marketEntry?.u && (
                                <span className="text-[10px] text-amber-400">Gebot: {marketEntry.u.n}</span>
                              )}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!selectedLeague) return;
                                  setSellingId(p.i);
                                  try {
                                    await kickbaseApi.removePlayerFromMarket(selectedLeague.li, p.i);
                                    setSellStatus({ type: "success", msg: `${p.n} vom Markt genommen` });
                                    loadMarket();
                                  } catch (err) {
                                    setSellStatus({ type: "error", msg: err instanceof Error ? err.message : "Fehler" });
                                  } finally {
                                    setSellingId(null);
                                  }
                                }}
                                disabled={sellingId === p.i}
                                className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-600/30 transition-colors"
                              >
                                {sellingId === p.i ? "..." : "Vom Markt nehmen"}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 justify-end">
                              <input
                                type="number"
                                placeholder={playerMv ? String(playerMv) : "Preis"}
                                onFocus={(e) => { if (!e.target.value && playerMv) e.target.value = String(playerMv); setSellPrice(String(playerMv || "")); }}
                                onChange={(e) => setSellPrice(e.target.value)}
                                className="w-28 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                              />
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!selectedLeague || !sellPrice) return;
                                  setSellingId(p.i);
                                  setSellStatus(null);
                                  try {
                                    await kickbaseApi.listPlayerForSale(selectedLeague.li, p.i, Number(sellPrice));
                                    setSellStatus({ type: "success", msg: `${p.n} für ${formatCurrency(Number(sellPrice))} auf den Markt gestellt!` });
                                    loadMarket();
                                  } catch (err) {
                                    setSellStatus({ type: "error", msg: err instanceof Error ? err.message : "Fehler" });
                                  } finally {
                                    setSellingId(null);
                                  }
                                }}
                                disabled={sellingId === p.i}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
                              >
                                {sellingId === p.i ? "..." : "Verkaufen"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
                {/* Player Header */}
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={playerImageUrl(selectedPlayer.pim)}
                    alt=""
                    className="h-16 w-16 rounded-full bg-zinc-700 object-cover"
                  />
                  <div>
                    <h2 className="text-xl font-bold">{selectedPlayer.fn} {selectedPlayer.n}</h2>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold text-white",
                          positionColor(selectedPlayer.pos)
                        )}
                      >
                        {positionLabel(selectedPlayer.pos)}
                      </span>
                      <span className="text-sm text-zinc-400">
                        {formatCurrency(selectedPlayer.mv)}
                      </span>
                      <span
                        className={cn(
                          "text-xs",
                          selectedPlayer.st === 0
                            ? "text-emerald-400"
                            : "text-amber-400"
                        )}
                      >
                        {statusLabel(selectedPlayer.st)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-6 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                    <p className="text-xs text-zinc-400">Punkte</p>
                    <p className="text-lg font-bold text-emerald-400">
                      {formatPoints(selectedPlayer.ap)}
                    </p>
                  </div>
                  {mvData && (
                    <>
                      <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                        <p className="text-xs text-zinc-400">Gewinn/Verlust</p>
                        <p
                          className={cn(
                            "text-lg font-bold",
                            mvData.prlo >= 0 ? "text-emerald-400" : "text-red-400"
                          )}
                        >
                          {mvData.prlo >= 0 ? (
                            <TrendingUp className="inline h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="inline h-4 w-4 mr-1" />
                          )}
                          {formatCurrency(Math.abs(mvData.prlo))}
                        </p>
                      </div>
                      <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                        <p className="text-xs text-zinc-400">Ertragspunkte</p>
                        <p className="text-lg font-bold">
                          {formatPoints(mvData.trp)}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Market Value Chart */}
                {mvLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                  </div>
                )}
                {mvData && mvData.it?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-2 text-sm font-medium text-zinc-300">
                      Marktwert-Entwicklung (90 Tage)
                    </h3>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mvData.it}>
                          <XAxis
                            dataKey="dt"
                            hide
                          />
                          <YAxis
                            tickFormatter={(v: number) =>
                              `${(v / 1_000_000).toFixed(1)}M`
                            }
                            width={50}
                            tick={{ fill: "#71717a", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#18181b",
                              border: "1px solid #3f3f46",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(value: unknown) => [
                              formatCurrency(Number(value)),
                              "Marktwert",
                            ]}
                            labelFormatter={() => ""}
                          />
                          <Line
                            type="monotone"
                            dataKey="mv"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-zinc-500">
                      <span>Min: {formatCurrency(mvData.lmv)}</span>
                      <span>Max: {formatCurrency(mvData.hmv)}</span>
                    </div>
                  </div>
                )}

                {/* Own Bids Details */}
                {selectedPlayer.ofs && selectedPlayer.ofs.length > 0 && (
                  <div className="mb-6 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                    <h3 className="mb-3 text-sm font-medium text-blue-400">Deine Gebote</h3>
                    <div className="space-y-2">
                      {selectedPlayer.ofs.map((o, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-md bg-zinc-800/50 px-3 py-2">
                          <div className="flex items-center gap-2">
                            {o.uim ? (
                              <img src={playerImageUrl(o.uim)} alt="" className="h-6 w-6 rounded-full" />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-zinc-700" />
                            )}
                            <span className="text-sm">{o.unm}</span>
                          </div>
                          <span className="text-sm font-bold text-blue-400">{formatCurrency(o.uop)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Highest Bidder (other user) */}
                {selectedPlayer.u && selectedPlayer.ofc === 0 && (
                  <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                    <h3 className="mb-3 text-sm font-medium text-amber-400">Höchstgebot</h3>
                    <div className="flex items-center justify-between rounded-md bg-zinc-800/50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        {selectedPlayer.u.uim ? (
                          <img src={playerImageUrl(selectedPlayer.u.uim)} alt="" className="h-6 w-6 rounded-full" />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-zinc-700" />
                        )}
                        <span className="text-sm">{selectedPlayer.u.n}</span>
                      </div>
                      <span className="text-sm font-bold text-amber-400">{formatCurrency(selectedPlayer.p)}</span>
                    </div>
                  </div>
                )}

                {/* Transfer History */}
                {thLoading && (
                  <div className="mb-6 flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                  </div>
                )}
                {transferHistory.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-3 text-sm font-medium text-zinc-300">Transfer-Historie</h3>
                    <div className="space-y-2">
                      {transferHistory.map((th, idx) => {
                        const date = new Date(th.dt);
                        const typeLabel = th.t === 0 ? "Gekauft" : th.t === 2 ? "Verkauft" : th.t === 4 ? "Vom Markt" : `Typ ${th.t}`;
                        const typeColor = th.t === 0 ? "text-emerald-400" : th.t === 2 ? "text-red-400" : "text-zinc-400";
                        return (
                          <div key={idx} className="flex items-center justify-between rounded-md bg-zinc-800/50 px-3 py-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className={cn("font-medium", typeColor)}>{typeLabel}</span>
                              {th.unm && <span className="text-zinc-400">von {th.unm}</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              {th.trp > 0 && <span className="font-medium">{formatCurrency(th.trp)}</span>}
                              <span className="text-xs text-zinc-500">
                                {date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bid Section */}
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-4">
                  <h3 className="mb-3 text-sm font-medium">Gebot abgeben</h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Betrag in €"
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      onClick={placeBid}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
                    >
                      Bieten
                    </button>
                  </div>
                  {bidStatus && (
                    <p
                      className={cn(
                        "mt-2 text-xs",
                        bidStatus.type === "success"
                          ? "text-emerald-400"
                          : "text-red-400"
                      )}
                    >
                      {bidStatus.msg}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
