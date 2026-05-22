'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { api } from '../../lib/api';
import type { Filters, AnalyticsResponse } from '../../types';

const EVENT_COLORS: Record<string, string> = {
  Kill: '#ef4444',
  Killed: '#e2e8f0',
  BotKill: '#f97316',
  BotKilled: '#ec4899',
  KilledByStorm: '#8b5cf6',
  Loot: '#f59e0b',
};

const MAP_COLORS: Record<string, string> = {
  AmbroseValley: '#22c55e',
  GrandRift: '#3b82f6',
  Lockdown: '#f59e0b',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card border border-bg-border2 rounded p-2 text-xs shadow-lg">
        <p className="text-txt-secondary mb-1 font-medium">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: <strong>{p.value?.toLocaleString()}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  trend?: 'up' | 'down' | 'flat';
  icon?: string;
}

function StatCard({ label, value, sub, color = '#3b82f6', trend, icon }: StatCardProps) {
  return (
    <div className="bg-bg-card border border-bg-border2 rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <span className="text-[11px] text-txt-muted uppercase tracking-wider">{label}</span>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-[11px] ${
              trend === 'up' ? 'text-accent-green' : trend === 'down' ? 'text-accent-red' : 'text-txt-muted'
            }`}
          >
            {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : <Minus size={12} />}
            <span>{trend === 'up' ? '+5%' : trend === 'down' ? '-3%' : '0%'}</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold" style={{ color }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <div className="text-[11px] text-txt-muted">{sub}</div>}
    </div>
  );
}

interface Props {
  filters: Filters;
}

export default function Analytics({ filters }: Props) {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .analytics({
        map_id: filters.mapId || undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
      })
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters.mapId, filters.dateFrom, filters.dateTo]);

  const ov = analytics?.overview;

  const kd =
    ov && ov.total_deaths > 0
      ? (ov.total_kills / ov.total_deaths).toFixed(2)
      : ov?.total_kills.toFixed(2) ?? '0.00';

  const avgSurvival = ov
    ? `${Math.floor((ov.avg_match_duration_seconds ?? 0) / 60)}m ${Math.round((ov.avg_match_duration_seconds ?? 0) % 60)}s`
    : '0m 0s';

  // Kills over time data
  const kilsOverTime = analytics?.kills_over_time ?? [];

  // Matches by map bar data
  const matchesByMap = Object.entries(analytics?.matches_by_map ?? {}).map(([map, count]) => ({
    name: map,
    count,
    fill: MAP_COLORS[map] || '#94a3b8',
  }));

  // Event breakdown pie
  const eventBreakdown = Object.entries(analytics?.event_breakdown ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value,
      fill: EVENT_COLORS[name] || '#94a3b8',
    }));

  // Player type donut
  const playerTypeData = [
    { name: 'Human', value: ov?.human_count ?? 0, fill: '#3b82f6' },
    { name: 'Bot', value: ov?.bot_count ?? 0, fill: '#ef4444' },
  ].filter((d) => d.value > 0);

  // Top matches
  const topMatches = analytics?.top_matches ?? [];

  // Insights
  const insights: { icon: string; title: string; body: string }[] = [];
  if (ov) {
    insights.push({
      icon: '⚔',
      title: 'Kill Activity',
      body: `${(ov.total_kills ?? 0).toLocaleString()} total kills across ${(ov.total_matches ?? 0).toLocaleString()} matches. Avg ${
        ov.total_matches > 0 ? Math.round(ov.total_kills / ov.total_matches) : 0
      } kills/match.`,
    });
    insights.push({
      icon: '🤖',
      title: 'Bot vs Human Ratio',
      body: `${ov.human_count} human players and ${ov.bot_count} bots. Bots represent ${
        ov.total_players > 0 ? Math.round((ov.bot_count / ov.total_players) * 100) : 0
      }% of all players.`,
    });
    if (kilsOverTime.length > 1) {
      const first = kilsOverTime[0];
      const last = kilsOverTime[kilsOverTime.length - 1];
      const trend = last.kills > first.kills ? 'increased' : 'decreased';
      insights.push({
        icon: '📈',
        title: 'Kill Trend',
        body: `Kill activity ${trend} from ${first.date} to ${last.date}. Storm deaths: ${ov.storm_deaths?.toLocaleString()}.`,
      });
    }
    insights.push({
      icon: '⭐',
      title: 'Loot Events',
      body: `${(ov.total_loot ?? 0).toLocaleString()} loot events recorded. Avg ${
        ov.total_matches > 0 ? Math.round(ov.total_loot / ov.total_matches) : 0
      } loot pickups per match.`,
    });
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-accent-blue animate-pulse">Loading analytics…</div>
          </div>
        )}

        {/* Overview stat cards */}
        <div className="grid grid-cols-6 gap-3">
          <StatCard label="Total Kills" value={ov?.total_kills ?? 0} color="#ef4444" icon="⚔" trend="up" />
          <StatCard label="Total Deaths" value={ov?.total_deaths ?? 0} color="#e2e8f0" icon="💀" trend="flat" />
          <StatCard label="K/D Ratio" value={kd} color="#22c55e" icon="📊" trend="up" />
          <StatCard label="Matches" value={ov?.total_matches ?? 0} color="#3b82f6" icon="🎮" trend="up" />
          <StatCard label="Human Players" value={ov?.human_count ?? 0} color="#60a5fa" icon="👤" trend="flat" />
          <StatCard label="Avg Survival" value={avgSurvival} color="#f59e0b" icon="⏱" trend="up" />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-2 gap-3">
          {/* Kills over time */}
          <div className="bg-bg-card border border-bg-border2 rounded-lg p-4">
            <div className="text-[11px] font-bold tracking-widest text-txt-secondary uppercase mb-3">
              Kills Over Time
            </div>
            {kilsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={kilsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3e" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#1e2a3e' }}
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <Line type="monotone" dataKey="kills" stroke="#ef4444" dot={false} strokeWidth={2} name="Kills" />
                  <Line type="monotone" dataKey="deaths" stroke="#94a3b8" dot={false} strokeWidth={2} name="Deaths" />
                  <Line type="monotone" dataKey="loot" stroke="#f59e0b" dot={false} strokeWidth={2} name="Loot" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-txt-muted text-sm">
                No time-series data available
              </div>
            )}
          </div>

          {/* Matches by map */}
          <div className="bg-bg-card border border-bg-border2 rounded-lg p-4">
            <div className="text-[11px] font-bold tracking-widest text-txt-secondary uppercase mb-3">
              Matches by Map
            </div>
            {matchesByMap.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={matchesByMap} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3e" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#1e2a3e' }}
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Matches" radius={[4, 4, 0, 0]}>
                    {matchesByMap.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-txt-muted text-sm">
                No match data available
              </div>
            )}
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-2 gap-3">
          {/* Event breakdown pie */}
          <div className="bg-bg-card border border-bg-border2 rounded-lg p-4">
            <div className="text-[11px] font-bold tracking-widest text-txt-secondary uppercase mb-3">
              Event Breakdown
            </div>
            {eventBreakdown.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={eventBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {eventBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {eventBreakdown.map((ev) => (
                    <div key={ev.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ev.fill }} />
                        <span className="text-[11px] text-txt-secondary">{ev.name}</span>
                      </div>
                      <span className="text-[11px] text-txt-primary font-medium">
                        {ev.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[160px] text-txt-muted text-sm">
                No event data available
              </div>
            )}
          </div>

          {/* Player type ratio */}
          <div className="bg-bg-card border border-bg-border2 rounded-lg p-4">
            <div className="text-[11px] font-bold tracking-widest text-txt-secondary uppercase mb-3">
              Player Type Ratio
            </div>
            {playerTypeData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={playerTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {playerTypeData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 flex-1">
                  {playerTypeData.map((d) => {
                    const pct =
                      ov && ov.total_players > 0
                        ? Math.round((d.value / ov.total_players) * 100)
                        : 0;
                    return (
                      <div key={d.name}>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                            <span className="text-[11px] text-txt-secondary">{d.name}</span>
                          </div>
                          <span className="text-[11px] text-txt-primary font-medium">
                            {d.value.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-bg-border2 rounded overflow-hidden">
                          <div
                            className="h-full rounded"
                            style={{ width: `${pct}%`, backgroundColor: d.fill }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[160px] text-txt-muted text-sm">
                No player data available
              </div>
            )}
          </div>
        </div>

        {/* Bottom section */}
        <div className="grid grid-cols-2 gap-3">
          {/* Top matches table */}
          <div className="bg-bg-card border border-bg-border2 rounded-lg p-4">
            <div className="text-[11px] font-bold tracking-widest text-txt-secondary uppercase mb-3">
              Top Matches by Kills
            </div>
            {topMatches.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-bg-border2">
                    <th className="text-left py-1.5 text-txt-muted font-medium">Match</th>
                    <th className="text-left py-1.5 text-txt-muted font-medium">Map</th>
                    <th className="text-right py-1.5 text-txt-muted font-medium">Players</th>
                    <th className="text-right py-1.5 text-txt-muted font-medium">Kills</th>
                  </tr>
                </thead>
                <tbody>
                  {topMatches.map((m: any, i) => (
                    <tr key={m.match_id} className="border-b border-bg-border2/50 hover:bg-bg-card/50">
                      <td className="py-1.5 text-txt-secondary font-mono">
                        {m.match_id?.slice(0, 10)}…
                      </td>
                      <td className="py-1.5">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: MAP_COLORS[m.map_id] || '#94a3b8' }}
                          />
                          <span className="text-txt-secondary">{m.map_id}</span>
                        </div>
                      </td>
                      <td className="py-1.5 text-right text-txt-secondary">{m.player_count}</td>
                      <td className="py-1.5 text-right text-accent-red font-semibold">{m.kill_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-txt-muted text-xs text-center py-4">No match data available</div>
            )}
          </div>

          {/* Insights cards */}
          <div className="bg-bg-card border border-bg-border2 rounded-lg p-4">
            <div className="text-[11px] font-bold tracking-widest text-txt-secondary uppercase mb-3">
              Insights
            </div>
            <div className="space-y-2">
              {insights.map((ins, i) => (
                <div key={i} className="bg-bg-dark border border-bg-border2 rounded p-3 flex gap-3">
                  <span className="text-xl shrink-0">{ins.icon}</span>
                  <div>
                    <div className="text-[11px] font-semibold text-txt-primary mb-0.5">{ins.title}</div>
                    <div className="text-[11px] text-txt-secondary leading-relaxed">{ins.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
