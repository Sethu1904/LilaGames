'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { PathsResponse, EventPoint, HeatmapResponse, Filters } from '../types';

export function useMatchData(filters: Filters) {
  const [paths, setPaths] = useState<PathsResponse | null>(null);
  const [events, setEvents] = useState<EventPoint[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaths = useCallback(async () => {
    if (!filters.matchId) {
      setPaths(null);
      return;
    }
    try {
      const data = await api.matchPaths(filters.matchId, filters.playerType);
      setPaths(data);
    } catch (e) {
      console.error('fetchPaths error', e);
    }
  }, [filters.matchId, filters.playerType]);

  const fetchEvents = useCallback(async () => {
    if (!filters.matchId) {
      setEvents([]);
      return;
    }
    try {
      const data = await api.matchEvents(
        filters.matchId,
        filters.eventTypes,
        filters.playerType
      );
      setEvents(data);
    } catch (e) {
      console.error('fetchEvents error', e);
    }
  }, [filters.matchId, filters.eventTypes, filters.playerType]);

  const fetchHeatmap = useCallback(async () => {
    try {
      const data = await api.heatmap({
        map_id: filters.mapId || undefined,
        date: filters.dateFrom || undefined,
        match_id: filters.matchId || undefined,
        type: filters.heatmapType,
      });
      setHeatmap(data);
    } catch (e) {
      console.error('fetchHeatmap error', e);
    }
  }, [filters.mapId, filters.dateFrom, filters.matchId, filters.heatmapType]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchPaths(), fetchEvents(), fetchHeatmap()])
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [fetchPaths, fetchEvents, fetchHeatmap]);

  return { paths, events, heatmap, loading, error };
}
