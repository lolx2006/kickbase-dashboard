# Kickbase Dashboard

Ein umfangreicher, inoffizieller Webclient für [Kickbase](https://www.kickbase.com/) — das Fantasy-Bundesliga-Managerspiel. Gebaut mit Next.js 16, React 19 und TailwindCSS 4.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

### Kern-Features
| Feature | Beschreibung |
|---|---|
| **Dashboard** | Manager-Ranking, letzte Transfers, Budget-Überblick, Team-Wert |
| **Transfermarkt** | Alle Spieler auf dem Markt mit Suche, Positionsfilter, Sortierung, Marktwert-Chart und Gebot-Funktion |
| **Live-Spieltag** | Echtzeit-Punkte aller Manager mit Auto-Refresh (30s), Navigation zu vergangenen Spieltagen |
| **Mein Team** | Aufstellung gruppiert nach Position mit Marktwert und Punkten |

### Analyse & Statistiken
| Feature | Beschreibung |
|---|---|
| **Spieltage** | Alle Bundesliga-Spieltage mit aufklappbaren Match-Details und Top-Spielern beider Teams |
| **Ranking-Verlauf** | Historischer Ranking-Verlauf aller Manager als interaktives Diagramm |
| **Top-Spieler** | Die besten Spieler der Saison nach Gesamtpunkten |
| **Spieler-Suche** | Globale Spielersuche über alle Bundesliga-Vereine |
| **Bundesliga-Tabelle** | Aktuelle Tabelle mit CL/EL/Conference-League/Abstieg-Markierungen |

### Transfer & Markt
| Feature | Beschreibung |
|---|---|
| **Gebots-Details** | Eigene Gebote und Höchstgebote im Transfermarkt-Modal sichtbar |
| **Transfer-Historie** | Kauf/Verkauf-Verlauf pro Spieler direkt im Modal |
| **Transfer-Log** | Aggregierte Transfer-Historie aller eigenen Spieler als Timeline |
| **Transfer-Kalkulator** | Budget-Planung für Käufe und Verkäufe |

### Weitere Features
| Feature | Beschreibung |
|---|---|
| **Manager-Übersicht** | Detailansicht aller Liga-Manager mit Team-Wert und Spieleranzahl |
| **Watchlist** | Spieler beobachten und Marktwert-Entwicklung verfolgen |
| **Liga-Feed** | Transfer-Aktivitäten der Liga gruppiert nach Datum |
| **Liga-Einstellungen** | Übersicht der Liga-Konfiguration |

---

## Tech Stack

| Technologie | Version | Verwendung |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16 | Framework (App Router, Server Components) |
| [React](https://react.dev/) | 19 | UI-Library |
| [TailwindCSS](https://tailwindcss.com/) | 4 | Styling |
| [Lucide React](https://lucide.dev/) | 0.577+ | Icons |
| [Recharts](https://recharts.org/) | 3.8+ | Diagramme & Charts |
| [date-fns](https://date-fns.org/) | 4.1+ | Datumsformatierung |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Typsicherheit |

---

## Installation & Setup

### Voraussetzungen
- [Node.js](https://nodejs.org/) >= 18
- Ein [Kickbase](https://www.kickbase.com/) Konto

### Schnellstart

```bash
# Repository klonen
git clone https://github.com/viatorlipsia161/kickbase-dashboard.git
cd kickbase-dashboard

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser und melde dich mit deinen Kickbase-Zugangsdaten an.

### Windows: Start per Doppelklick

Die Datei `start.bat` startet den Server automatisch und öffnet den Browser:

```batch
start.bat
```

---

## Projektstruktur

```
kickbase-dashboard/
├── src/
│   ├── app/
│   │   ├── api/proxy/       # Server-side API-Proxy (CORS-Umgehung)
│   │   ├── login/           # Login-Seite
│   │   ├── dashboard/       # Dashboard mit Ranking + Transfers
│   │   ├── market/          # Transfermarkt mit Geboten & Marktwert-Charts
│   │   ├── live/            # Live-Spieltag mit Spieltag-Navigation
│   │   ├── team/            # Eigenes Team
│   │   ├── matchdays/       # Spieltage mit Match-Details
│   │   ├── table/           # Bundesliga-Tabelle
│   │   ├── ranking/         # Ranking-Verlauf (Chart)
│   │   ├── top-players/     # Top-Spieler der Saison
│   │   ├── managers/        # Manager-Übersicht
│   │   ├── search/          # Spieler-Suche
│   │   ├── watchlist/       # Watchlist
│   │   ├── calculator/      # Transfer-Kalkulator
│   │   ├── transfers/       # Transfer-Log (Timeline)
│   │   ├── feed/            # Liga-Feed
│   │   └── settings/        # Liga-Einstellungen
│   ├── components/
│   │   ├── app-shell.tsx    # Layout-Wrapper
│   │   └── sidebar.tsx      # Navigation mit Liga-Auswahl
│   ├── context/
│   │   └── auth-context.tsx # Auth-State (Login, Token, Liga-Auswahl)
│   └── lib/
│       ├── kickbase-api.ts  # API-Client (alle Kickbase v4 Endpunkte)
│       └── utils.ts         # Hilfsfunktionen (Formatierung, Positionen)
├── start.bat                # Windows-Startskript
├── package.json
└── tsconfig.json
```

---

## API

Dieses Projekt kommuniziert mit der **inoffiziellen Kickbase API v4** (`https://api.kickbase.com/v4/`). Alle API-Aufrufe werden über einen serverseitigen Proxy (`/api/proxy`) geleitet, um CORS-Probleme zu vermeiden.

**Genutzte Endpunkte:**
- `/v4/user/login` — Authentifizierung
- `/v4/leagues/{id}/market` — Transfermarkt
- `/v4/leagues/{id}/lineup` — Eigene Aufstellung
- `/v4/leagues/{id}/ranking` — Manager-Ranking (mit Spieltag-Parameter)
- `/v4/leagues/{id}/live` — Live-Performance
- `/v4/leagues/{id}/players/{id}/stats` — Spieler-Statistiken
- `/v4/leagues/{id}/players/{id}/marketvalue/{days}` — Marktwert-Verlauf
- `/v4/leagues/{id}/players/{id}/transferhistory` — Transfer-Historie
- `/v4/competitions/{id}/matchdays` — Spieltage & Matches
- `/v4/competitions/{id}/players` — Alle Bundesliga-Spieler
- `/v4/competitions/{id}/table` — Bundesliga-Tabelle

---

## Sicherheit & Datenschutz

- Zugangsdaten werden **nur im Browser-Speicher** (Session) gehalten
- Es werden **keine Daten an Dritte** übermittelt
- Alle API-Aufrufe gehen direkt über den lokalen Proxy an die Kickbase-Server
- **Kein Tracking, keine Cookies, keine Analytics**

---

## Hinweis

> Dieses Projekt ist **nicht offiziell** von Kickbase autorisiert. Es nutzt die inoffizielle Kickbase API v4. Bitte verantwortungsvoll nutzen und die [Kickbase-Nutzungsbedingungen](https://www.kickbase.com/) beachten. Übermäßige API-Anfragen können zur Sperrung deines Kontos führen.

---

## Lizenz

MIT License — siehe [LICENSE](LICENSE) für Details.
