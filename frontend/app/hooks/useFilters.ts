'use client';

import { useState, useCallback } from 'react';
import type { Filters, PlayerTypeFilter, HeatmapType } from '../types';

const DEFAULT_FILTERS: Filters = {
  mapId: 'AmbroseValley',
  dateFrom: '',
  dateTo: '',
  matchId: '',
  playerType: 'all',
  eventTypes: ['Kill', 'Killed', 'BotKill', 'BotKilled', 'KilledByStorm', 'Loot'],
  heatmapType: 'kills',
  heatmapIntensity: 70,
};

export function useFilters() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<Filters>(DEFAULT_FILTERS);

  const update = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const apply = useCallback(() => {
    setApplied({ ...filters });
  }, [filters]);

  const reset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
  }, []);

  const toggleEventType = useCallback((type: string) => {
    setFilters((prev) => {
      const has = prev.eventTypes.includes(type);
      return {
        ...prev,
        eventTypes: has
          ? prev.eventTypes.filter((t) => t !== type)
          : [...prev.eventTypes, type],
      };
    });
  }, []);

  return { filters, applied, update, apply, reset, toggleEventType };
}
