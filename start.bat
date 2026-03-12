@echo off
title Kickbase Web Client v2.0
echo ==========================================
echo   Kickbase Web Client v2.0
echo ==========================================
echo.
echo   Features:
echo   - Dashboard mit Manager-Ranking
echo   - Transfermarkt mit Schnäppchen-Finder
echo   - Einsatzwahrscheinlichkeit (prob)
echo   - Mein Team mit Spieler-Details
echo   - Spieltag-Übersicht (alle 34 Spieltage)
echo   - Ranking-Verlauf (Punkte/Platz-Chart)
echo   - Top-Spieler der Liga
echo   - Manager-Profile mit Kader-Ansicht
echo   - Spieler-Suche Liga-weit
echo   - Watchlist (Spieler beobachten)
echo   - Transfer-Kalkulator (Gewinn/Verlust)
echo   - Liga-Einstellungen
echo   - Live-Spieltag mit Auto-Refresh
echo   - Bundesliga-Tabelle
echo.
echo ==========================================
echo.

:: Pruefen ob node_modules existiert
if not exist "node_modules" (
    echo [INFO] Installiere Abhaengigkeiten...
    call npm install
    if errorlevel 1 (
        echo [FEHLER] npm install fehlgeschlagen!
        pause
        exit /b 1
    )
    echo.
)

echo [INFO] Starte Kickbase Web Client...
echo [INFO] Oeffne http://localhost:3000 im Browser
echo [INFO] Druecke Ctrl+C zum Beenden
echo.
start "" http://localhost:3000
call npm run dev
pause
