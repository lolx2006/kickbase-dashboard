"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { kickbaseApi, type LeagueInfo } from "@/lib/kickbase-api";
import { Loader2 } from "lucide-react";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw || raw === "undefined" || raw === "null") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export interface User {
  id: string;
  email: string;
  name: string;
  uim: string;
}

interface AuthContextType {
  user: User | null;
  leagues: LeagueInfo[];
  selectedLeague: LeagueInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  selectLeague: (league: LeagueInfo) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  leagues: [],
  selectedLeague: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  selectLeague: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [leagues, setLeagues] = useState<LeagueInfo[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<LeagueInfo | null>(null);
  const [ready, setReady] = useState(false);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    if (kickbaseApi.isAuthenticated()) {
      const u = safeParse<User | null>(localStorage.getItem("kb_user"), null);
      const l = safeParse<LeagueInfo[]>(localStorage.getItem("kb_leagues"), []);
      const sl = safeParse<LeagueInfo | null>(localStorage.getItem("kb_selected_league"), null);
      setUser(u);
      setLeagues(l);
      setSelectedLeague(sl);
    }
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await kickbaseApi.login(email, password);
    const u: User = {
      id: data.u?.id || "",
      email: data.u?.email || "",
      name: data.u?.name || "",
      uim: data.u?.uim || "",
    };
    setUser(u);
    localStorage.setItem("kb_user", JSON.stringify(u));
    const lgs = data.leagues || [];
    setLeagues(lgs);
    localStorage.setItem("kb_leagues", JSON.stringify(lgs));
    if (lgs.length > 0) {
      setSelectedLeague(lgs[0]);
      localStorage.setItem("kb_selected_league", JSON.stringify(lgs[0]));
    }
  }, []);

  const logout = useCallback(() => {
    kickbaseApi.clearAuth();
    setUser(null);
    setLeagues([]);
    setSelectedLeague(null);
  }, []);

  const selectLeague = useCallback((league: LeagueInfo) => {
    setSelectedLeague(league);
    localStorage.setItem("kb_selected_league", JSON.stringify(league));
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        leagues,
        selectedLeague,
        isAuthenticated: !!user && kickbaseApi.isAuthenticated(),
        isLoading: !ready,
        login,
        logout,
        selectLeague,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
