import type {
  FiltersResponse,
  MatchSummary,
  PathsResponse,
  EventPoint,
  HeatmapResponse,
  AnalyticsResponse,
} from '../types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function get<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(BASE + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const api = {
  health: () => get<{ status: string; loaded: boolean; total_rows: number }>('/api/health'),

  filters: () => get<FiltersResponse>('/api/filters'),

  matches: (params?: { map_id?: string; date?: string }) =>
    get<MatchSummary[]>('/api/matches', params),

  matchPaths: (matchId: string, playerType?: string) =>
    get<PathsResponse>(`/api/match/${matchId}/paths`, {
      player_type: playerType,
    }),

  matchEvents: (matchId: string, eventTypes?: string[], playerType?: string) =>
    get<EventPoint[]>(`/api/match/${matchId}/events`, {
      event_types: eventTypes?.join(','),
      player_type: playerType,
    }),

  heatmap: (params: {
    map_id?: string;
    date?: string;
    match_id?: string;
    type?: string;
  }) => get<HeatmapResponse>('/api/heatmap', params),

  analytics: (params?: {
    map_id?: string;
    date_from?: string;
    date_to?: string;
  }) => get<AnalyticsResponse>('/api/analytics', params),

  statsOverview: () =>
    get<{ total_rows: number; total_matches: number; total_players: number }>('/api/stats/overview'),

  minimapUrl: (mapName: string) => `${BASE}/api/minimap/${mapName}`,
};
