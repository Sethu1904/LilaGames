'use client';

import { useEffect, useRef } from 'react';
import { MAP_CONFIGS, worldToCanvas, drawEventMarker } from '../lib/mapUtils';
import type { PlayerPath, EventPoint } from '../types';

interface Props {
  mapId: string;
  players: PlayerPath[];
  events: EventPoint[];
  showEvents?: boolean;
  playbackProgress?: number; // 0–1, fraction of total ts to show
  width?: number;
  height?: number;
  className?: string;
}

const MOVE_EVENTS = new Set(['Position', 'BotPosition']);

export default function MapCanvas({
  mapId,
  players,
  events,
  showEvents = true,
  playbackProgress = 1,
  width = 600,
  height = 400,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cfg = MAP_CONFIGS[mapId];
    if (!cfg) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (!players || players.length === 0) return;

    // Determine timestamp range for playback
    let minTs = Infinity;
    let maxTs = -Infinity;
    for (const p of players) {
      for (const pt of p.path) {
        if (pt.ts < minTs) minTs = pt.ts;
        if (pt.ts > maxTs) maxTs = pt.ts;
      }
    }
    const cutoffTs = minTs + (maxTs - minTs) * playbackProgress;

    // Draw paths
    for (const player of players) {
      const visiblePath = player.path.filter(
        (pt) => pt.ts <= cutoffTs && MOVE_EVENTS.has(pt.event)
      );
      if (visiblePath.length < 2) continue;

      ctx.save();
      ctx.strokeStyle = player.color;
      ctx.lineWidth = player.is_bot ? 1 : 1.5;
      ctx.globalAlpha = 0.7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      for (let i = 0; i < visiblePath.length; i++) {
        const { px, py } = worldToCanvas(visiblePath[i].x, visiblePath[i].z, cfg, W, H);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Draw dot at current position
      if (visiblePath.length > 0) {
        const last = visiblePath[visiblePath.length - 1];
        const { px, py } = worldToCanvas(last.x, last.z, cfg, W, H);
        ctx.globalAlpha = 1;
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(px, py, player.is_bot ? 3 : 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Draw event markers
    if (showEvents && events) {
      for (const ev of events) {
        if (ev.ts > cutoffTs) continue;
        if (MOVE_EVENTS.has(ev.event)) continue;
        const { px, py } = worldToCanvas(ev.x, ev.z, cfg, W, H);
        drawEventMarker(ctx, px, py, ev.event, 5);
      }
    }
  }, [mapId, players, events, showEvents, playbackProgress]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
}
