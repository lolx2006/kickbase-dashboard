"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { kickbaseApi, type TransferHistoryItem } from "@/lib/kickbase-api";
import { AppShell } from "@/components/app-shell";
import { playerImageUrl, formatCurrency, cn } from "@/lib/utils";
import { ArrowRightLeft, Loader2, RefreshCw, ShoppingCart, DollarSign, XCircle } from "lucide-react";

interface PlayerTransfer extends TransferHistoryItem {
  playerName: string;
  playerImg?: string;
}

export default function TransfersPage() {
  const { selectedLeague } = useAuth();
  const [transfers, setTransfers] = useState<PlayerTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!selectedLeague) return;
    setLoading(true);
    try {
      const lineup = await kickbaseApi.getLineup(selectedLeague.li);
      const players = lineup.it || [];
      const allTransfers: PlayerTransfer[] = [];
      const results = await Promise.all(
        players.map((p) =>
          kickbaseApi
            .request<{ it: TransferHistoryItem[] }>(
              `/v4/leagues/${selectedLeague.li}/players/${p.i}/transferhistory`
            )
            .then((res) => ({ player: p, items: res.it || [] }))
            .catch(() => ({ player: p, items: [] }))
        )
      );
      for (const r of results) {
        for (const th of r.items) {
          allTransfers.push({
            ...th,
            playerName: r.player.n,
            playerImg: r.player.pim,
          });
        }
      }
      allTransfers.sort((a, b) => new Date(b.dt).getTime() - new Date(a.dt).getTime());
      setTransfers(allTransfers);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => {
    load();
  }, [load]);

  const typeIcon = (t: number) => {
    if (t === 0) return <ShoppingCart className="h-4 w-4 text-emerald-400" />;
    if (t === 2) return <DollarSign className="h-4 w-4 text-red-400" />;
    if (t === 4) return <XCircle className="h-4 w-4 text-zinc-400" />;
    return <ArrowRightLeft className="h-4 w-4 text-zinc-400" />;
  };

  const typeLabel = (t: number) => {
    if (t === 0) return "Gekauft";
    if (t === 2) return "Verkauft";
    if (t === 4) return "Vom Markt genommen";
    return `Transfer (${t})`;
  };

  const typeColor = (t: number) => {
    if (t === 0) return "text-emerald-400";
    if (t === 2) return "text-red-400";
    return "text-zinc-400";
  };

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ArrowRightLeft className="h-6 w-6 text-orange-400" />
              Transfer-Log
            </h1>
            <p className="text-sm text-zinc-400">
              {transfers.length} Transfers deiner Spieler
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Aktualisieren
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        )}

        {!loading && transfers.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-12 text-center">
            <ArrowRightLeft className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-zinc-400">Keine Transfer-Daten verfügbar</p>
          </div>
        )}

        {!loading && transfers.length > 0 && (
          <div className="space-y-2">
            {transfers.map((tr, idx) => {
              const date = new Date(tr.dt);
              return (
                <div
                  key={idx}
                  className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-zinc-800">
                    {typeIcon(tr.t)}
                  </div>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {tr.playerImg && (
                      <img
                        src={playerImageUrl(tr.playerImg)}
                        alt=""
                        className="h-8 w-8 rounded-full bg-zinc-700 object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{tr.playerName}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={cn("font-medium", typeColor(tr.t))}>
                          {typeLabel(tr.t)}
                        </span>
                        {tr.unm && (
                          <span className="text-zinc-500">
                            {tr.t === 0 ? "von" : "an"} {tr.unm}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {tr.trp > 0 ? (
                      <p className={cn("font-bold", tr.t === 0 ? "text-red-400" : "text-emerald-400")}>
                        {tr.t === 0 ? "-" : "+"}{formatCurrency(tr.trp)}
                      </p>
                    ) : (
                      <p className="text-zinc-500 text-sm">Kostenlos</p>
                    )}
                    <p className="text-xs text-zinc-500">
                      {date.toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
