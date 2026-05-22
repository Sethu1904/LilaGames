// ── API types ─────────────────────────────────────────────────────────────────

export interface MatchSummary {
  match_id: string;
  map_id: string;
  date: string;
  player_count?: number;
  event_count?: number;
  human_count?: number;
  bot_count?: number;
  kill_count?: number;
}

export interface FiltersResponse {
  maps: string[];
  dates: string[];
  matches: MatchSummary[];
}

export interface PathPoint {
  x: number;
  z: number;
  ts: number;
  event: string;
}

export interface PlayerPath {
  user_id: string;
  is_bot: boolean;
  color: string;
  path: PathPoint[];
}

export interface PathsResponse {
  map_id: string;
  players: PlayerPath[];
}

export interface EventPoint {
  user_id: string;
  is_bot: boolean;
  x: number;
  z: number;
  ts: number;
  event: string;
  ts_seconds: number;
}

export interface HeatmapPoint {
  x: number;
  z: number;
  weight: number;
}

export interface HeatmapResponse {
  map_id: string;
  points: HeatmapPoint[];
  max_weight: number;
}

export interface AnalyticsOverview {
  total_kills: number;
  total_deaths: number;
  total_loot: number;
  storm_deaths: number;
  total_matches: number;
  total_players: number;
  avg_match_duration_seconds: number;
  human_count: number;
  bot_count: number;
}

export interface KillsOverTimePoint {
  date: string;
  kills: number;
  deaths: number;
  loot: number;
}

export interface AnalyticsResponse {
  overview: AnalyticsOverview;
  kills_over_time: KillsOverTimePoint[];
  top_matches: MatchSummary[];
  event_breakdown: Record<string, number>;
  matches_by_map: Record<string, number>;
}

// ── Filter state ──────────────────────────────────────────────────────────────

export type TabId = 'map' | 'heatmap' | 'events' | 'analytics';
export type PlayerTypeFilter = 'all' | 'human' | 'bot';
export type HeatmapType = 'kills' | 'deaths' | 'movement' | 'loot';

export interface Filters {
  mapId: string;
  dateFrom: string;
  dateTo: string;
  matchId: string;
  playerType: PlayerTypeFilter;
  eventTypes: string[];
  heatmapType: HeatmapType;
  heatmapIntensity: number;
}

// ── Map config ────────────────────────────────────────────────────────────────

export interface MapConfig {
  scale: number;
  originX: number;
  originZ: number;
}
