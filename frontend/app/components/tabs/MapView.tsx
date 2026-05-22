'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import MapCanvas from '../MapCanvas';
import StatsPanel from '../StatsPanel';
import Timeline from '../Timeline';
import { api } from '../../lib/api';
import { MAP_COLORS } from '../../lib/mapUtils';
import type { Filters, PathsResponse, EventPoint } from '../../types';

const MAPS = ['AmbroseValley', 'GrandRift', 'Lockdown'];

interface MapPanelProps {
  mapId: string;
  paths: PathsResponse | null;
  events: EventPoint[];
  filters: Filters;
  playbackProgress: number;
  large?: boolean;
}

function MapPanel({ mapId, paths, events, filters, playbackProgress, large = false }: MapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 600, h: 400 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDims({ w: Math.round(width), h: Math.round(height) });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const mapColor = MAP_COLORS[mapId] || '#94a3b8';
  const minimapUrl = api.minimapUrl(mapId);

  const matchPlayers = paths?.map_id === mapId ? paths.players : [];
  const matchEvents = paths?.map_id === mapId ? events : [];

  return (
    <div className={`flex flex-col bg-bg-card border border-bg-border2 rounded overflow-hidden ${large ? 'flex-1' : ''}`}>
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-bg-border2 bg-bg-dark">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mapColor }} />
          <span className="text-xs font-semibold text-txt-primary">{mapId}</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-accent-green/20 text-accent-green rounded-full border border-accent-green/30">
            Live
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
            className="p-1 text-txt-muted hover:text-txt-primary transition-colors"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            className="p-1 text-txt-muted hover:text-txt-primary transition-colors"
          >
            <ZoomOut size={12} />
          </button>
          <button className="p-1 text-txt-muted hover:text-txt-primary transition-colors">
            <Maximize2 size={12} />
          </button>
        </div>
      </div>

      {/* Map area */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden bg-bg-darkest" style={{ minHeight: large ? 200 : 140 }}>
        {/* Minimap image */}
        <img
          src={minimapUrl}
          alt={mapId}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.2s' }}
          draggable={false}
        />

        {/* Canvas overlay */}
        {dims.w > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.2s' }}
          >
            <MapCanvas
              mapId={mapId}
              players={matchPlayers}
              events={matchEvents}
              showEvents={true}
              playbackProgress={playbackProgress}
              width={dims.w}
              height={dims.h}
            />
          </div>
        )}

        {/* Scale bar */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <div className="w-10 h-0.5 bg-txt-primary/70" />
          <span className="text-[9px] text-txt-secondary">500m</span>
        </div>

        {/* No data overlay */}
        {matchPlayers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-txt-muted text-xs">Select a match to view paths</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  filters: Filters;
}

export default function MapView({ filters }: Props) {
  const [paths, setPaths] = useState<PathsResponse | null>(null);
  const [events, setEvents] = useState<EventPoint[]>([]);
  const [playbackProgress, setPlaybackProgress] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!filters.matchId) {
      setPaths(null);
      setEvents([]);
      return;
    }
    setLoading(true);
    Promise.all([
      api.matchPaths(filters.matchId, filters.playerType),
      api.matchEvents(filters.matchId, filters.eventTypes, filters.playerType),
    ])
      .then(([p, e]) => {
        setPaths(p);
        setEvents(e);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters.matchId, filters.playerType, filters.eventTypes]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* Map grid */}
        <div className="flex-1 flex flex-col gap-2 p-2 overflow-hidden">
          {/* Large primary map */}
          <MapPanel
            mapId={filters.mapId || 'AmbroseValley'}
            paths={paths}
            events={events}
            filters={filters}
            playbackProgress={playbackProgress}
            large
          />
          {/* Two smaller maps */}
          <div className="flex gap-2 h-44">
            {MAPS.filter((m) => m !== (filters.mapId || 'AmbroseValley')).map((mapId) => (
              <div key={mapId} className="flex-1">
                <MapPanel
                  mapId={mapId}
                  paths={null}
                  events={[]}
                  filters={filters}
                  playbackProgress={playbackProgress}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right stats panel */}
        <StatsPanel events={events} players={paths?.players ?? []} />
      </div>

      {/* Timeline */}
      <Timeline events={events} onProgressChange={setPlaybackProgress} />
    </div>
  );
}
