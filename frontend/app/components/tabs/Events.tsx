'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import MapCanvas from '../MapCanvas';
import Timeline from '../Timeline';
import { api } from '../../lib/api';
import { MAP_COLORS, MAP_CONFIGS, worldToCanvas } from '../../lib/mapUtils';
import type { Filters, PathsResponse, EventPoint } from '../../types';

const EVENT_COLORS: Record<string, string> = {
  Kill: '#ef4444',
  Killed: '#e2e8f0',
  BotKill: '#f97316',
  BotKilled: '#ec4899',
  KilledByStorm: '#8b5cf6',
  Loot: '#f59e0b',
};

const EVENT_ICONS: Record<string, string> = {
  Kill: '⚔',
  Killed: '💀',
  BotKill: '🤖',
  BotKilled: '🔴',
  KilledByStorm: '⚡',
  Loot: '⭐',
};

const QUICK_FILTERS = [
  { label: 'Kills', types: ['Kill', 'BotKill'], color: '#ef4444' },
  { label: 'Deaths', types: ['Killed', 'BotKilled'], color: '#e2e8f0' },
  { label: 'Loot', types: ['Loot'], color: '#f59e0b' },
  { label: 'Storm Deaths', types: ['KilledByStorm'], color: '#8b5cf6' },
];

interface Props {
  filters: Filters;
}

export default function Events({ filters }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 600, h: 400 });
  const [paths, setPaths] = useState<PathsResponse | null>(null);
  const [events, setEvents] = useState<EventPoint[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventPoint | null>(null);
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([
    'Kill', 'BotKill', 'Killed', 'BotKilled', 'KilledByStorm', 'Loot',
  ]);
  const [playbackProgress, setPlaybackProgress] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDims({ w: Math.round(entry.contentRect.width), h: Math.round(entry.contentRect.height) });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!filters.matchId) {
      setPaths(null);
      setEvents([]);
      return;
    }
    setLoading(true);
    Promise.all([
      api.matchPaths(filters.matchId, filters.playerType),
      api.matchEvents(filters.matchId, undefined, filters.playerType),
    ])
      .then(([p, e]) => {
        setPaths(p);
        setEvents(e);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters.matchId, filters.playerType]);

  const mapId = paths?.map_id ?? filters.mapId ?? 'AmbroseValley';
  const mapColor = MAP_COLORS[mapId] || '#94a3b8';
  const minimapUrl = api.minimapUrl(mapId);

  const toggleQuickFilter = (types: string[]) => {
    setActiveQuickFilters((prev) => {
      const allActive = types.every((t) => prev.includes(t));
      if (allActive) return prev.filter((t) => !types.includes(t));
      else return [...new Set([...prev, ...types])];
    });
  };

  const filteredEvents = events.filter((e) => activeQuickFilters.includes(e.event));

  const formatTime = (secs?: number) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Map area */}
        <div className="flex-1 flex flex-col p-2 overflow-hidden">
          {/* Quick filter pills */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-txt-muted uppercase tracking-wider">Quick Filter:</span>
            {QUICK_FILTERS.map((qf) => {
              const active = qf.types.every((t) => activeQuickFilters.includes(t));
              return (
                <button
                  key={qf.label}
                  onClick={() => toggleQuickFilter(qf.types)}
                  className={`text-[11px] px-3 py-1 rounded-full border transition-all ${
                    active
                      ? 'border-opacity-100 text-white'
                      : 'border-bg-border2 text-txt-muted hover:text-txt-secondary'
                  }`}
                  style={
                    active
                      ? { borderColor: qf.color, backgroundColor: qf.color + '33', color: qf.color }
                      : {}
                  }
                >
                  {qf.label}
                </button>
              );
            })}
          </div>

          {/* Map panel */}
          <div className="flex-1 bg-bg-card border border-bg-border2 rounded overflow-hidden relative">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-bg-border2 bg-bg-dark">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mapColor }} />
                <span className="text-xs font-semibold text-txt-primary">{mapId}</span>
                <span className="text-[10px] text-txt-muted">
                  {filteredEvents.length} events visible
                </span>
              </div>
            </div>
            <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-bg-darkest" style={{ minHeight: 200 }}>
              <img
                src={minimapUrl}
                alt={mapId}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
              {dims.w > 0 && (
                <MapCanvas
                  mapId={mapId}
                  players={paths?.players ?? []}
                  events={filteredEvents}
                  showEvents={true}
                  playbackProgress={playbackProgress}
                  width={dims.w}
                  height={dims.h}
                  className="absolute inset-0 pointer-events-none"
                />
              )}
              {!filters.matchId && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-txt-muted text-xs">Select a match to see events</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right event log */}
        <aside className="w-72 shrink-0 bg-bg-sidebar border-l border-bg-border2 flex flex-col overflow-hidden">
          {/* Event log */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-bg-border2 bg-bg-dark">
              <span className="text-[10px] font-bold tracking-widest text-txt-secondary uppercase">
                Event Log ({filteredEvents.length})
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredEvents.length === 0 ? (
                <div className="p-4 text-center text-txt-muted text-xs">
                  No events match the current filter.
                </div>
              ) : (
                filteredEvents.map((ev, i) => {
                  const color = EVENT_COLORS[ev.event] || '#94a3b8';
                  const icon = EVENT_ICONS[ev.event] || '●';
                  const isSelected = selectedEvent === ev;
                  return (
                    <button
                      key={`${ev.ts}-${i}`}
                      onClick={() => setSelectedEvent(isSelected ? null : ev)}
                      className={`w-full text-left px-3 py-2 border-b border-bg-border2 transition-all hover:bg-bg-card/50 ${
                        isSelected ? 'bg-bg-card' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-txt-muted w-10 shrink-0 font-mono">
                          {formatTime(ev.ts_seconds)}
                        </span>
                        <span className="shrink-0">{icon}</span>
                        <span
                          className="text-[11px] font-semibold shrink-0"
                          style={{ color }}
                        >
                          {ev.event}
                        </span>
                        <span
                          className={`text-[11px] truncate ${
                            ev.is_bot ? 'text-accent-red' : 'text-accent-blue'
                          }`}
                        >
                          {ev.user_id.slice(0, 12)}…
                        </span>
                      </div>
                      <div className="text-[10px] text-txt-muted mt-0.5 pl-12">
                        ({ev.x.toFixed(0)}, {ev.z.toFixed(0)})
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected event details */}
          <div className="h-36 border-t border-bg-border2 p-3 bg-bg-dark shrink-0">
            <span className="text-[10px] font-bold tracking-widest text-txt-secondary uppercase block mb-2">
              Event Details
            </span>
            {selectedEvent ? (
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[10px] text-txt-muted">Type</span>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: EVENT_COLORS[selectedEvent.event] || '#94a3b8' }}
                  >
                    {selectedEvent.event}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-txt-muted">Time</span>
                  <span className="text-[11px] text-txt-secondary font-mono">
                    {formatTime(selectedEvent.ts_seconds)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-txt-muted">Player</span>
                  <span
                    className={`text-[11px] ${
                      selectedEvent.is_bot ? 'text-accent-red' : 'text-accent-blue'
                    }`}
                  >
                    {selectedEvent.is_bot ? 'Bot' : 'Human'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-txt-muted">Location</span>
                  <span className="text-[11px] text-txt-secondary font-mono">
                    ({selectedEvent.x.toFixed(0)}, {selectedEvent.z.toFixed(0)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-txt-muted">Weapon</span>
                  <span className="text-[11px] text-txt-secondary">AK-47</span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-txt-muted">Click an event to see details.</div>
            )}
          </div>
        </aside>
      </div>

      {/* Timeline */}
      <Timeline events={filteredEvents} onProgressChange={setPlaybackProgress} />
    </div>
  );
}
