const CDN_URL = "https://kickbase.b-cdn.net";

export interface LoginResponseRaw {
  tkn: string;
  tknex: string;
  u: {
    id: string;
    email: string;
    name: string;
    notifications: number;
    cover: string;
    flags: number;
    proExpiry: string;
    profile: string;
    uim: string;
  };
  srvl: Array<{
    id: string;
    name: string;
    cpi: string;
    au: number;
    mu: number;
    creator: string;
    creatorId: string;
    adm: boolean;
    uim?: string;
  }>;
}

export interface LoginResponse {
  tkn: string;
  tknex: string;
  u: LoginResponseRaw["u"];
  leagues: LeagueInfo[];
}

export interface LeagueInfo {
  li: string;
  lnm: string;
  cpi: string;
  mgc: number;
  mgm: number;
  lim?: string;
}

export interface ManagerRanking {
  ti: string;
  cpi: string;
  day: number;
  us: Array<{
    i: string;
    n: string;
    sp: number;
    mdp: number;
    tv: number;
    spl: number;
    mdpl: number;
    pa: boolean;
    lp: number[];
    uim?: string;
    adm?: boolean;
  }>;
  clpc: number;
}

export interface MarketPlayer {
  i: string;
  fn: string;
  n: string;
  tid: string;
  pos: number;
  st: number;
  mvt: number;
  mv: number;
  p: number;
  ap: number;
  ofc: number;
  exs: number;
  prc: number;
  isn: boolean;
  iposl: boolean;
  dt: string;
  pim: string;
  prob: number;
  uop?: number;
  uoid?: string;
  ofs?: Array<{ u: string; unm: string; uop: number; st: number; uim?: string }>;
  u?: { i: string; n: string; uim?: string; isvf: boolean; st: number };
}

export interface MarketResponse {
  it: MarketPlayer[];
  nps: number;
  tv: number;
  day: number;
}

export interface PlayerStats {
  i: string;
  tid: string;
  n: string;
  t1: number;
  t2: number;
  t1g: number;
  t2g: number;
  p: number;
  st: number;
  mi: number;
  mt: number;
  mtd: string;
  md: string;
  mst: number;
  k: number[];
  events: Array<{
    ei: string;
    eti: number;
    p: number;
    mt: number;
    att: number;
    cei?: string;
    ke?: number;
    ddi?: string;
  }>;
  pim: string;
  t1im: string;
  t2im: string;
}

export interface MarketValueResponse {
  it: Array<{ dt: number; mv: number }>;
  trp: number;
  prlo: number;
  lmv: number;
  hmv: number;
  iso: boolean;
  idp: boolean;
}

export interface TransferHistoryItem {
  pi?: string;
  pn?: string;
  tid?: string;
  tty?: number;
  t: number;
  trp: number;
  dt: string;
  pim?: string;
  othnm?: string;
  u?: string;
  unm?: string;
  uim?: string;
}

export interface LineupPlayer {
  i: string;
  n: string;
  tid: string;
  pos: number;
  lo: number;
  st: number;
  lst: number;
  mdst: number;
  ap: number;
  os: string;
  pim: string;
  prob: number;
  ictp: boolean;
  ht: boolean;
  ph: Array<{ hp: boolean; p?: number }>;
}

export interface LineupResponse {
  it: LineupPlayer[];
  cpte: boolean;
}

export interface LeagueMeResponse {
  b: number;
  bs: number;
  lnm: string;
  cpi: string;
  mgc: number;
  mgm: number;
  adm: boolean;
  tpc: Array<{ tid: string; npt: number; tim: string }>;
}

export interface MatchdayPerformance {
  us: Array<{
    i: string;
    n: string;
    sp: number;
    mdp: number;
    tv: number;
    spl: number;
    mdpl: number;
    pa: boolean;
    lp: number[];
    uim?: string;
  }>;
  clpc: number;
}

export interface MatchdayInfo {
  day: number;
  cur: boolean;
  mdp: number;
  tw: boolean;
}

export interface CompetitionMatchday {
  day: number;
  ms: Array<{
    mi: string;
    t1i: string;
    t2i: string;
    t1n: string;
    t2n: string;
    t1s: number;
    t2s: number;
    t1im: string;
    t2im: string;
    st: number;
    md: string;
  }>;
}

export interface TeamInfo {
  i: string;
  n: string;
  p: number;
  tim: string;
}

class KickbaseAPI {
  private token: string | null = null;
  private tokenExpiry: string | null = null;

  private ensureToken() {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("kb_token");
      this.tokenExpiry = localStorage.getItem("kb_token_expiry");
    }
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    this.ensureToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`/api/proxy?path=${encodeURIComponent(path)}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      this.clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`API Error ${res.status}: ${errorBody}`);
    }

    return res.json();
  }

  setAuth(token: string, expiry: string) {
    this.token = token;
    this.tokenExpiry = expiry;
    if (typeof window !== "undefined") {
      localStorage.setItem("kb_token", token);
      localStorage.setItem("kb_token_expiry", expiry);
    }
  }

  clearAuth() {
    this.token = null;
    this.tokenExpiry = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("kb_token");
      localStorage.removeItem("kb_token_expiry");
      localStorage.removeItem("kb_user");
      localStorage.removeItem("kb_leagues");
      localStorage.removeItem("kb_selected_league");
    }
  }

  isAuthenticated(): boolean {
    this.ensureToken();
    if (!this.token || !this.tokenExpiry) return false;
    return new Date(this.tokenExpiry) > new Date();
  }

  getToken(): string | null {
    return this.token;
  }

  // === AUTH ===
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch("/api/proxy?path=" + encodeURIComponent("/v4/user/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ em: email, pass: password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.errMsg || "Login fehlgeschlagen");
    }

    const raw: LoginResponseRaw = await res.json();

    this.setAuth(raw.tkn, raw.tknex);

    const leagues: LeagueInfo[] = (raw.srvl || []).map((s) => ({
      li: s.id,
      lnm: s.name,
      cpi: s.cpi,
      mgc: s.au,
      mgm: s.mu,
      lim: s.uim,
    }));

    const result: LoginResponse = {
      tkn: raw.tkn,
      tknex: raw.tknex,
      u: raw.u,
      leagues,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("kb_user", JSON.stringify(raw.u || {}));
      localStorage.setItem("kb_leagues", JSON.stringify(leagues));
    }

    return result;
  }

  // === LEAGUES ===
  async getLeagueOverview(leagueId: string): Promise<Record<string, unknown>> {
    return this.request(`/v4/leagues/${leagueId}/overview`);
  }

  async getLeagueRanking(leagueId: string, matchDay?: number): Promise<ManagerRanking> {
    const path = matchDay
      ? `/v4/leagues/${leagueId}/ranking?matchDay=${matchDay}`
      : `/v4/leagues/${leagueId}/ranking`;
    return this.request(path);
  }

  async getLeagueMatchdays(leagueId: string): Promise<{ it: MatchdayInfo[] }> {
    return this.request(`/v4/leagues/${leagueId}/matchdays`);
  }

  async getLeagueFeed(leagueId: string, start = 0): Promise<Record<string, unknown>> {
    return this.request(`/v4/leagues/${leagueId}/feed?start=${start}`);
  }

  async getLeagueMe(leagueId: string): Promise<LeagueMeResponse> {
    return this.request(`/v4/leagues/${leagueId}/me`);
  }

  // === MARKET ===
  async getMarket(leagueId: string): Promise<MarketResponse> {
    return this.request(`/v4/leagues/${leagueId}/market`);
  }

  async getPlayerMarketValue(
    leagueId: string,
    playerId: string,
    timeframe = 92
  ): Promise<MarketValueResponse> {
    return this.request(
      `/v4/leagues/${leagueId}/players/${playerId}/marketvalue/${timeframe}`
    );
  }

  async placeOffer(leagueId: string, playerId: string, amount: number): Promise<Record<string, unknown>> {
    return this.request(`/v4/leagues/${leagueId}/market/${playerId}/offers`, {
      method: "POST",
      body: JSON.stringify({ price: amount }),
    });
  }

  async getPlayerOffers(leagueId: string, playerId: string): Promise<Record<string, unknown>> {
    return this.request(`/v4/leagues/${leagueId}/market/${playerId}/offers`);
  }

  async sellPlayer(leagueId: string, playerId: string, price: number): Promise<Record<string, unknown>> {
    return this.request(`/v4/leagues/${leagueId}/market/${playerId}`, {
      method: "POST",
      body: JSON.stringify({ price }),
    });
  }

  async removeFromMarket(leagueId: string, playerId: string): Promise<Record<string, unknown>> {
    return this.request(`/v4/leagues/${leagueId}/market/${playerId}`, {
      method: "DELETE",
    });
  }

  // === MY TEAM ===
  async getLineup(leagueId: string): Promise<LineupResponse> {
    return this.request(`/v4/leagues/${leagueId}/lineup`);
  }

  async getMyPlayers(leagueId: string): Promise<Record<string, unknown>> {
    return this.request(`/v4/leagues/${leagueId}/myplayers`);
  }

  // === PLAYER ===
  async getPlayerStats(
    leagueId: string,
    playerId: string
  ): Promise<PlayerStats> {
    return this.request(`/v4/leagues/${leagueId}/players/${playerId}/stats`);
  }

  async getPlayerProfile(
    competitionId: string,
    playerId: string
  ): Promise<Record<string, unknown>> {
    return this.request(
      `/v4/competitions/${competitionId}/players/${playerId}/profile`
    );
  }

  // === COMPETITION ===
  async getCompetitionMatchdays(competitionId: string): Promise<Record<string, unknown>> {
    return this.request(`/v4/competitions/${competitionId}/matchdays`);
  }

  async getCompetitionTable(competitionId: string): Promise<Record<string, unknown>> {
    return this.request(`/v4/competitions/${competitionId}/table`);
  }

  async getCompetitionTop25(
    competitionId: string,
    matchDay?: number
  ): Promise<Record<string, unknown>> {
    const path = matchDay
      ? `/v4/competitions/${competitionId}/top25?matchDay=${matchDay}`
      : `/v4/competitions/${competitionId}/top25`;
    return this.request(path);
  }

  async getCompetitionTeams(competitionId: string): Promise<Record<string, unknown>> {
    return this.request(`/v4/competitions/${competitionId}/teams`);
  }

  async getMatchdayMatches(
    competitionId: string,
    matchDay: number
  ): Promise<Record<string, unknown>> {
    return this.request(
      `/v4/competitions/${competitionId}/matchdays/${matchDay}`
    );
  }

  async getMatchLineup(
    competitionId: string,
    matchId: string
  ): Promise<Record<string, unknown>> {
    return this.request(
      `/v4/competitions/${competitionId}/matches/${matchId}/lineup`
    );
  }

  async getMatchEvents(
    competitionId: string,
    matchId: string
  ): Promise<Record<string, unknown>> {
    return this.request(
      `/v4/competitions/${competitionId}/matches/${matchId}/events`
    );
  }

  // === SELL / LIST PLAYER ===
  async listPlayerForSale(
    leagueId: string,
    playerId: string,
    price: number
  ): Promise<Record<string, unknown>> {
    return this.request(`/v4/leagues/${leagueId}/market`, {
      method: "POST",
      body: JSON.stringify({ pi: playerId, p: price }),
    });
  }

  async removePlayerFromMarket(
    leagueId: string,
    playerId: string
  ): Promise<Record<string, unknown>> {
    return this.request(`/v4/leagues/${leagueId}/market/${playerId}`, {
      method: "DELETE",
    });
  }

  // === LINEUP SAVE ===
  async setLineup(
    leagueId: string,
    playerIds: string[]
  ): Promise<Record<string, unknown>> {
    return this.request(`/v4/leagues/${leagueId}/lineup`, {
      method: "POST",
      body: JSON.stringify({ it: playerIds }),
    });
  }

  // === LIVE ===
  async getLiveMatch(
    competitionId: string,
    matchId: string
  ): Promise<Record<string, unknown>> {
    return this.request(
      `/v4/competitions/${competitionId}/matches/${matchId}/live`
    );
  }

  async getLivePerformance(leagueId: string): Promise<MatchdayPerformance> {
    return this.request(`/v4/leagues/${leagueId}/live`);
  }

  // === NEWS ===
  async getNews(): Promise<Record<string, unknown>> {
    return this.request("/v4/content/news");
  }

  // === USER ===
  async refreshToken(): Promise<Record<string, unknown>> {
    return this.request("/v4/user/refreshtokens", { method: "POST" });
  }
}

export const kickbaseApi = new KickbaseAPI();
export { CDN_URL };
