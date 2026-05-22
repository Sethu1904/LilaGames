'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import HeatmapCanvas from '../HeatmapCanvas';
import { api } from '../../lib/api';
import { MAP_COLORS } from '../../lib/mapUtils';
import type { Filters, HeatmapResponse, AnalyticsResponse } from '../../types';

const HEATMAP_TYPE_LABELS: Record<string, string> = {
  kills: 'Kill Heatmap',
  deaths: 'Death Heatmap',
  movement: 'Movement Heatmap',
  loot: 'Loot Heatmap',
};

interface Props {
  filters: Filters;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card border border-bg-border2 rounded p-2 text-xs">
        <p className="text-txt-secondary mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Heatmaps({ filters }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
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
    setLoading(true);
    Promise.all([
      api.heatmap({
        map_id: filters.mapId || undefined,
        date: filters.dateFrom || undefined,
        match_id: filters.matchId || undefined,
        type: filters.heatmapType,
      }),
      api.analytics({
        map_id: filters.mapId || undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
      }),
    ])
      .then(([h, a]) => {
        setHeatmap(h);
        setAnalytics(a);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters.mapId, filters.dateFrom, filters.dateTo, filters.matchId, filters.heatmapType]);

  const mapId = filters.mapId || 'AmbroseValley';
  const mapColor = MAP_COLORS[mapId] || '#94a3b8';
  const minimapUrl = api.minimapUrl(mapId);

  // Build donut data from top matches
  const topMatches = analytics?.top_matches?.slice(0, 5) ?? [];
  const donutData = topMatches.map((m: any) => ({
    name: m.match_id?.slice(0, 8) + '…',
    value: m.kill_count ?? 0,
  }));
  const donutColors = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#8b5cf6'];

  // Insights
  const insights: string[] = [];
  if (heatmap && heatmap.points.length > 0) {
    const topPoint = heatmap.points.reduce((a, b) => (a.weight > b.weight ? a : b));
    insights.push(`Highest concentration at (${topPoint.x.toFixed(0)}, ${topPoint.z.toFixed(0)}) with ${topPoint.weight.toFixed(0)} events.`);
    insights.push(`${heatmap.points.length} active cells recorded for ${HEATMAP_TYPE_LABELS[filters.heatmapType]}.`);
    insights.push(`Max density: ${heatmap.max_weight.toFixed(0)} events in single zone.`);
  } else {
    insights.push('Select a map and apply filters to see heatmap insights.');
    insights.push('Try changing the heatmap type in the sidebar.');
    insights.push('Narrowing the date range focuses hotspot analysis.');
  }

  // Kills over time
  const kilsOverTime = analytics?.kills_over_time ?? [];

  const ov = analytics?.overview;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Map area */}
      <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        {/* Map panel */}
        <div className="flex-1 flex flex-col bg-bg-card border border-bg-border2 rounded overflow-hidden relative">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-bg-border2 bg-bg-dark">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mapColor }} />
              <span className="text-xs font-semibold text-txt-primary">{mapId}</span>
              <span className="text-[10px] text-txt-secondary px-1.5 py-0.5 bg-bg-card border border-bg-border2 rounded">
                {HEATMAP_TYPE_LABELS[filters.heatmapType]}
              </span>
            </div>
            <button
              onClick={() => setShowHeatmap((s) => !s)}
              className="text-[11px] text-accent-blue hover:text-blue-300 transition-colors"
            >
              {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
            </button>
          </div>

          {/* Map + heatmap */}
          <div ref={containerRef} className="relative flex-1 overflow-hidden bg-bg-darkest">
            <img
              src={minimapUrl}
              alt={mapId}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
            {showHeatmap && heatmap && dims.w > 0 && (
              <HeatmapCanvas
                mapId={mapId}
                points={heatmap.points}
                maxWeight={heatmap.max_weight}
                intensity={filters.heatmapIntensity}
                width={dims.w}
                height={dims.h}
                className="absolute inset-0 pointer-events-none"
              />
            )}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="text-accent-blue text-sm animate-pulse">Loading heatmap…</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <aside className="w-64 shrink-0 bg-bg-sidebar border-l border-bg-border2 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Overview stats */}
          <div>
            <span className="text-[10px] font-bold tracking-widest text-txt-secondary uppercase block mb-2">
              Overview
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Kills', value: ov?.total_kills ?? 0, color: '#ef4444' },
                { label: 'Deaths', value: ov?.total_deaths ?? 0, color: '#e2e8f0' },
                { label: 'Loot', value: ov?.total_loot ?? 0, color: '#f59e0b' },
                { label: 'Storm', value: ov?.storm_deaths ?? 0, color: '#8b5cf6' },
              ].map((s) => (
                <div key={s.label} className="bg-bg-card border border-bg-border2 rounded p-2">
                  <div className="text-[10px] text-txt-muted">{s.label}</div>
                  <div className="text-base font-bold" style={{ color: s.color }}>
                    {s.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div>
            <span className="text-[10px] font-bold tracking-widest text-txt-secondary uppercase block mb-2">
              Heatmap Insights
            </span>
            <div className="space-y-2">
              {insights.map((ins, i) => (
                <div key={i} className="bg-bg-card border border-bg-border2 rounded p-2">
                  <div className="flex items-start gap-2">
                    <span className="text-accent-blue shrink-0 text-xs">▶</span>
                    <span className="text-[11px] text-txt-secondary leading-relaxed">{ins}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap statistics donut */}
          {donutData.length > 0 && (
            <div>
              <span className="text-[10px] font-bold tracking-widest text-txt-secondary uppercase block mb-2">
                Kills by Match
              </span>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={44}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={donutColors[i % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Kills over time line */}
          {kilsOverTime.length > 0 && (
            <div>
              <span className="text-[10px] font-bold tracking-widest text-txt-secondary uppercase block mb-2">
                Kills Over Time
              </span>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={kilsOverTime}>
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="kills" stroke="#ef4444" dot={false} strokeWidth={1.5} name="Kills" />
                  <Line type="monotone" dataKey="deaths" stroke="#94a3b8" dot={false} strokeWidth={1.5} name="Deaths" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Map info */}
          <div>
            <span className="text-[10px] font-bold tracking-widest text-txt-secondary uppercase block mb-2">
              Map Info
            </span>
            <div className="bg-bg-card border border-bg-border2 rounded p-2 space-y-1.5">
              {[
                { label: 'Map', value: mapId },
                {
                  label: 'Size',
                  value:
                    mapId === 'AmbroseValley'
                      ? '900×900'
                      : mapId === 'GrandRift'
                      ? '581×581'
                      : '1000×1000',
                },
                {
                  label: 'Terrain',
                  value:
                    mapId === 'AmbroseValley'
                      ? 'Valley/Forest'
                      : mapId === 'GrandRift'
                      ? 'Rift/Canyon'
                      : 'Urban',
                },
                {
                  label: 'POIs',
                  value: mapId === 'AmbroseValley' ? '12' : mapId === 'GrandRift' ? '9' : '15',
                },
                { label: 'Matches', value: String(analytics?.matches_by_map?.[mapId] ?? 0) },
              ].map((row) => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-[10px] text-txt-muted">{row.label}</span>
                  <span className="text-[11px] text-txt-secondary">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
