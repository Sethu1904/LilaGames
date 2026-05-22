'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { api } from '../lib/api';
import { MAP_COLORS } from '../lib/mapUtils';
import type { Filters, FiltersResponse, HeatmapType, TabId } from '../types';

const ALL_EVENT_TYPES = [
  'Kill',
  'Killed',
  'BotKill',
  'BotKilled',
  'KilledByStorm',
  'Loot',
];

const EVENT_COLORS: Record<string, string> = {
  Kill: '#ef4444',
  Killed: '#e2e8f0',
  BotKill: '#f97316',
  BotKilled: '#ec4899',
  KilledByStorm: '#8b5cf6',
  Loot: '#f59e0b',
};

const HEATMAP_TYPES: { value: HeatmapType; label: string; color: string }[] = [
  { value: 'kills', label: 'Kill Heatmap', color: '#ef4444' },
  { value: 'deaths', label: 'Death Heatmap', color: '#e2e8f0' },
  { value: 'movement', label: 'Movement Heatmap', color: '#3b82f6' },
  { value: 'loot', label: 'Loot Heatmap', color: '#f59e0b' },
];

interface Props {
  filters: Filters;
  onUpdate: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onApply: () => void;
  onReset: () => void;
  onToggleEventType: (type: string) => void;
  activeTab: TabId;
}

export default function Sidebar({
  filters,
  onUpdate,
  onApply,
  onReset,
  onToggleEventType,
  activeTab,
}: Props) {
  const [filtersData, setFiltersData] = useState<FiltersResponse | null>(null);
  const [filteredMatches, setFilteredMatches] = useState<FiltersResponse['matches']>([]);

  useEffect(() => {
    api.filters().then((data) => {
      setFiltersData(data);
      setFilteredMatches(data.matches.slice(0, 100));
    });
  }, []);

  useEffect(() => {
    if (!filtersData) return;
    let matches = filtersData.matches;
    if (filters.mapId) matches = matches.filter((m) => m.map_id === filters.mapId);
    if (filters.dateFrom) matches = matches.filter((m) => m.date >= filters.dateFrom);
    if (filters.dateTo) matches = matches.filter((m) => m.date <= filters.dateTo);
    setFilteredMatches(matches.slice(0, 200));
  }, [filtersData, filters.mapId, filters.dateFrom, filters.dateTo]);

  const showEventFilters = activeTab === 'map' || activeTab === 'events';
  const showHeatmapControls = activeTab === 'heatmap';

  return (
    <aside className="w-[260px] shrink-0 bg-bg-sidebar border-r border-bg-border2 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-widest text-txt-secondary uppercase">
            Filters
          </span>
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-[11px] text-accent-blue hover:text-blue-300 transition-colors"
          >
            <RefreshCw size={10} />
            Reset All
          </button>
        </div>

        {/* Map selector */}
        <div>
          <label className="block text-[10px] text-txt-muted uppercase tracking-wider mb-2">
            Map
          </label>
          <div className="space-y-1.5">
            {(filtersData?.maps ?? ['AmbroseValley', 'GrandRift', 'Lockdown']).map((map) => (
              <button
                key={map}
                onClick={() => onUpdate('mapId', map)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left text-xs transition-all ${
                  filters.mapId === map
                    ? 'bg-accent-blue/20 border border-accent-blue/50 text-txt-primary'
                    : 'bg-bg-card border border-bg-border2 text-txt-secondary hover:border-accent-blue/30'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: MAP_COLORS[map] || '#94a3b8' }}
                />
                <span className="truncate font-medium">{map}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div>
          <label className="block text-[10px] text-txt-muted uppercase tracking-wider mb-2">
            Date Range
          </label>
          <div className="space-y-1.5">
            <div>
              <span className="text-[10px] text-txt-muted mb-1 block">From</span>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onUpdate('dateFrom', e.target.value)}
                className="w-full text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-txt-muted mb-1 block">To</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onUpdate('dateTo', e.target.value)}
                className="w-full text-xs"
              />
            </div>
          </div>
        </div>

        {/* Match ID */}
        <div>
          <label className="block text-[10px] text-txt-muted uppercase tracking-wider mb-2">
            Match
          </label>
          <select
            value={filters.matchId}
            onChange={(e) => onUpdate('matchId', e.target.value)}
            className="w-full text-xs"
          >
            <option value="">All Matches</option>
            {filteredMatches.map((m) => (
              <option key={m.match_id} value={m.match_id}>
                {m.match_id.slice(0, 12)}… ({m.map_id})
              </option>
            ))}
          </select>
        </div>

        {/* Player type */}
        <div>
          <label className="block text-[10px] text-txt-muted uppercase tracking-wider mb-2">
            Player Type
          </label>
          <div className="space-y-1.5">
            {(['all', 'human', 'bot'] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="playerType"
                  value={type}
                  checked={filters.playerType === type}
                  onChange={() => onUpdate('playerType', type)}
                  className="accent-blue-500"
                />
                <span className="text-xs text-txt-secondary capitalize">
                  {type === 'all' ? 'All Players' : type === 'human' ? 'Human Players' : 'Bots'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Event type checkboxes (Map / Events tabs) */}
        {showEventFilters && (
          <div>
            <label className="block text-[10px] text-txt-muted uppercase tracking-wider mb-2">
              Events
            </label>
            <div className="space-y-1.5">
              {ALL_EVENT_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.eventTypes.includes(type)}
                    onChange={() => onToggleEventType(type)}
                  />
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: EVENT_COLORS[type] || '#94a3b8' }}
                  />
                  <span className="text-xs text-txt-secondary">{type}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Heatmap controls */}
        {showHeatmapControls && (
          <>
            <div>
              <label className="block text-[10px] text-txt-muted uppercase tracking-wider mb-2">
                Heatmap Type
              </label>
              <div className="space-y-1.5">
                {HEATMAP_TYPES.map((ht) => (
                  <label key={ht.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="heatmapType"
                      value={ht.value}
                      checked={filters.heatmapType === ht.value}
                      onChange={() => onUpdate('heatmapType', ht.value)}
                      className="accent-blue-500"
                    />
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: ht.color }}
                    />
                    <span className="text-xs text-txt-secondary">{ht.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-txt-muted uppercase tracking-wider mb-2">
                Intensity: {filters.heatmapIntensity}%
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={filters.heatmapIntensity}
                onChange={(e) => onUpdate('heatmapIntensity', Number(e.target.value))}
                className="w-full"
              />
            </div>
          </>
        )}

        {/* Apply button */}
        <button
          onClick={onApply}
          className="w-full py-2 bg-accent-blue hover:bg-blue-600 text-white text-xs font-semibold rounded tracking-wider transition-colors"
        >
          APPLY FILTERS
        </button>

        {/* Map overview */}
        <div>
          <label className="block text-[10px] text-txt-muted uppercase tracking-wider mb-2">
            Map Overview
          </label>
          <div className="space-y-1.5">
            {(filtersData?.maps ?? ['AmbroseValley', 'GrandRift', 'Lockdown']).map((map) => (
              <div
                key={map}
                className="flex items-center justify-between px-2 py-1.5 bg-bg-card rounded border border-bg-border2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: MAP_COLORS[map] || '#94a3b8' }}
                  />
                  <span className="text-[11px] text-txt-secondary">{map}</span>
                </div>
                <span className="text-[10px] text-txt-muted">Active</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
