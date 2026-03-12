import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | undefined | null): string {
  const v = value ?? 0;
  if (v >= 1_000_000) {
    return `${(v / 1_000_000).toFixed(1)}M €`;
  }
  if (v >= 1_000) {
    return `${(v / 1_000).toFixed(0)}K €`;
  }
  return `${v.toLocaleString("de-DE")} €`;
}

export function formatPoints(value: number | undefined | null): string {
  return (value ?? 0).toLocaleString("de-DE");
}

export function playerImageUrl(path: string): string {
  if (!path) return "";
  return `https://kickbase.b-cdn.net/${path}`;
}

export function positionLabel(pos: number): string {
  switch (pos) {
    case 1: return "TW";
    case 2: return "ABW";
    case 3: return "MF";
    case 4: return "ST";
    default: return "?";
  }
}

export function positionColor(pos: number): string {
  switch (pos) {
    case 1: return "bg-yellow-500";
    case 2: return "bg-blue-500";
    case 3: return "bg-green-500";
    case 4: return "bg-red-500";
    default: return "bg-gray-500";
  }
}

export function statusLabel(st: number): string {
  if (st === 0) return "Fit";
  if (st & 1) return "Verletzt";
  if (st & 2) return "Angeschlagen";
  if (st & 4) return "Aufbautraining";
  if (st & 8) return "Rote Karte";
  if (st & 16) return "Gelb-Rot";
  if (st & 32) return "5. Gelbe";
  if (st & 64) return "Nicht im Kader";
  if (st & 128) return "Nicht in der Liga";
  return "Unbekannt";
}

export function transferTypeLabel(tty: number): string {
  switch (tty) {
    case 1: return "Kauf";
    case 2: return "Verkauf";
    case 12: return "Vom Markt genommen";
    default: return "Transfer";
  }
}
