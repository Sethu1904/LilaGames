'use client';

import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { EventPoint, PlayerPath } from '../types';

const EVENT_COLORS: Record<string, string> = {
  Kill: '#ef4444',
  Killed: '#e2e8f0',
  BotKill: '#f97316',
  BotKilled: '#ec4899',
  KilledByStorm: '#8b5cf6',
  Loot: '#f59e0b',
};

interface StatCardProps {
  label: string;
  value: number | string;
  color?: string;
  icon?: string;
}

function StatCard({ label, value, color = '#3b82f6', icon }: StatCardProps) {
  return (
    <div className="bg-bg-card border border-bg-border2 rounded p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-base">{icon}</span>}
        <span className="text-[10px] text-txt-muted uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-xl font-bold" style={{ color }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

interface Props {
  events: EventPoint[];
  players: PlayerPath[];
}

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card border border-bg-border2 rounded p-2 text-xs">
        <p className="text-txt-secondary mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function StatsPanel({ events, players }: Props) {
  // Compute stats
  const kills = events.filter((e) => e.event === 'Kill' || e.event === 'BotKill').length;
  const deaths = events.filter((e) => ['Killed', 'BotKilled', 'KilledByStorm'].includes(e.event)).length;
  const loot = events.filter((e) => e.event === 'Loot').length;
  const stormDeaths = events.filter((e) => e.event === 'KilledByStorm').length;

  const humanCount = players.filter((p) => !p.is_bot).length;
  const botCount = players.filter((p) => p.is_bot).length;

  // Player type donut
  const playerTypeData = [
    { name: 'Human', value: humanCount, color: '#3b82f6' },
    { name: 'Bot', value: botCount, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  // Activity over time (bucket by ts_seconds into 10 buckets)
  const sortedEvents = [...events].sort((a, b) => (a.ts_seconds ?? 0) - (b.ts_seconds ?? 0));
  const maxTs = sortedEvents.length > 0 ? (sortedEvents[sortedEvents.length - 1].ts_seconds ?? 0) : 0;
  const BUCKETS = 10;
  const bucketSize = maxTs > 0 ? maxTs / BUCKETS : 1;
  const timelineData = Array.from({ length: BUCKETS }, (_, i) => {
    const from = i * bucketSize;
    const to = (i + 1) * bucketSize;
    const bucket = sortedEvents.filter((e) => (e.ts_seconds ?? 0) >= from && (e.ts_seconds ?? 0) < to);
    return {
      name: `${Math.round(from)}s`,
      kills: bucket.filter((e) => ['Kill', 'BotKill'].includes(e.event)).length,
      deaths: bucket.filter((e) => ['Killed', 'BotKilled', 'KilledByStorm'].includes(e.event)).length,
      loot: bucket.filter((e) => e.event === 'Loot').length,
    };
  });

  // Top hot zones (10x10 grid)
  const hotZones: { label: string; count: number }[] = [];
  if (events.length > 0) {
    const killEvents = events.filter((e) => ['Kill', 'BotKill'].includes(e.event));
    if (killEvents.length > 0) {
      const xs = killEvents.map((e) => e.x);
      const zs = killEvents.map((e) => e.z);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minZ = Math.min(...zs);
      const maxZ = Math.max(...zs);
      const cellW = (maxX - minX) / 10 || 1;
      const cellH = (maxZ - minZ) / 10 || 1;
      const grid: Record<string, number> = {};
      for (const ev of killEvents) {
        const ci = Math.min(Math.floor((ev.x - minX) / cellW), 9);
        const cj = Math.min(Math.floor((ev.z - minZ) / cellH), 9);
        const key = `Zone(${ci},${cj})`;
        grid[key] = (grid[key] ?? 0) + 1;
      }
      Object.entries(grid)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([label, count]) => hotZones.push({ label, count }));
    }
  }
  const maxZoneKills = hotZones[0]?.count ?? 1;

  // Recent event
  const recentEvent = sortedEvents.filter((e) => !['Position', 'BotPosition'].includes(e.event)).at(-1);

  return (
    <aside className="w-64 shrink-0 bg-bg-sidebar border-l border-bg-border2 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Match stats */}
        <div>
          <span className="text-[10px] font-bold tracking-widest text-txt-secondary uppercase block mb-2">
            Match Stats
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <StatCard label="Kills" value={kills} color="#ef4444" icon="⚔" />
            <StatCard label="Deaths" value={deaths} color="#e2e8f0" icon="💀" />
            <StatCard label="Loot" value={loot} color="#f59e0b" icon="⭐" />
            <StatCard label="Storm" value={stormDeaths} color="#8b5cf6" icon="⚡" />
          </div>
        </div>

        {/* Event legend */}
        <div>
          <span className="text-[10px] font-bold tracking-widest text-txt-secondary uppercase block mb-2">
            Event Legend
          </span>
          <div className="space-y-1">
            {Object.entries(EVENT_COLORS).map(([evt, color]) => (
              <div key={evt} className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
                <span className="text-[11px] text-txt-secondary">{evt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Player type donut */}
        {playerTypeData.length > 0 && (
          <div>
            <span className="text-[10px] font-bold tracking-widest text-txt-secondary uppercase block mb-2">
              Player Type
            </span>
            <div className="flex items-center gap-2">
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie
                    data={playerTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={22}
                    outerRadius={36}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {playerTypeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1">
                {playerTypeData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[11px] text-txt-secondary">
                      {d.name}: <strong className="text-txt-primary">{d.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top hot zones */}
        {hotZones.length > 0 && (
          <div>
            <span className="text-[10px] font-bold tracking-widest text-txt-secondary uppercase block mb-2">
              Top Hot Zones
            </span>
            <div className="space-y-1.5">
              {hotZones.map((zone, i) => (
                <div key={zone.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-txt-muted w-3">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[11px] text-txt-secondary">{zone.label}</span>
                      <span className="text-[11px] text-accent-red">{zone.count}</span>
                    </div>
                    <div className="h-1 bg-bg-border2 rounded overflow-hidden">
                      <div
                        className="h-full bg-accent-red rounded"
                        style={{ width: `${(zone.count / maxZoneKills) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity over time */}
        {timelineData.some((d) => d.kills + d.deaths + d.loot > 0) && (
          <div>
            <span className="text-[10px] font-bold tracking-widest text-txt-secondary uppercase block mb-2">
              Activity Over Time
            </span>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={timelineData}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Line type="monotone" dataKey="kills" stroke="#ef4444" dot={false} strokeWidth={1.5} name="Kills" />
                <Line type="monotone" dataKey="deaths" stroke="#94a3b8" dot={false} strokeWidth={1.5} name="Deaths" />
                <Line type="monotone" dataKey="loot" stroke="#f59e0b" dot={false} strokeWidth={1.5} name="Loot" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent event */}
        {recentEvent && (
          <div>
            <span className="text-[10px] font-bold tracking-widest text-txt-secondary uppercase block mb-2">
              Last Event
            </span>
            <div className="bg-bg-card border border-bg-border2 rounded p-2 space-y-1">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold"
                  style={{ color: EVENT_COLORS[recentEvent.event] || '#94a3b8' }}
                >
                  {recentEvent.event}
                </span>
                <span className="text-[10px] text-txt-muted">{recentEvent.ts_seconds?.toFixed(1)}s</span>
              </div>
              <div className="text-[11px] text-txt-secondary truncate">
                {recentEvent.user_id.slice(0, 16)}…
              </div>
              <div className="text-[10px] text-txt-muted">
                {recentEvent.x.toFixed(0)}, {recentEvent.z.toFixed(0)}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
