'use client';

import { useEffect, useRef } from 'react';
import { MAP_CONFIGS, worldToCanvas } from '../lib/mapUtils';
import type { HeatmapPoint } from '../types';

interface Props {
  mapId: string;
  points: HeatmapPoint[];
  maxWeight: number;
  intensity?: number; // 0–100
  width?: number;
  height?: number;
  className?: string;
}

// Color stops for heatmap: blue → cyan → green → yellow → red
function weightToColor(norm: number): [number, number, number] {
  // norm: 0–1
  const stops: [number, [number, number, number]][] = [
    [0.0, [0, 0, 255]],
    [0.25, [0, 255, 255]],
    [0.5, [0, 255, 0]],
    [0.75, [255, 255, 0]],
    [1.0, [255, 0, 0]],
  ];

  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (norm >= t0 && norm <= t1) {
      const t = (norm - t0) / (t1 - t0);
      return [
        Math.round(c0[0] + t * (c1[0] - c0[0])),
        Math.round(c0[1] + t * (c1[1] - c0[1])),
        Math.round(c0[2] + t * (c1[2] - c0[2])),
      ];
    }
  }
  return [255, 0, 0];
}

export default function HeatmapCanvas({
  mapId,
  points,
  maxWeight,
  intensity = 70,
  width = 800,
  height = 600,
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
    if (!points || points.length === 0) return;

    const effectiveMax = maxWeight > 0 ? maxWeight : 1;
    const alpha = (intensity / 100) * 0.85;
    const radius = Math.max(W, H) * 0.04; // ~4% of canvas dimension

    // Offscreen canvas for accumulation
    const offscreen = document.createElement('canvas');
    offscreen.width = W;
    offscreen.height = H;
    const offCtx = offscreen.getContext('2d')!;
    offCtx.globalCompositeOperation = 'source-over';

    for (const pt of points) {
      const norm = Math.min(pt.weight / effectiveMax, 1);
      const { px, py } = worldToCanvas(pt.x, pt.z, cfg, W, H);
      const r = radius * (0.5 + norm * 0.5);

      const grad = offCtx.createRadialGradient(px, py, 0, px, py, r);
      const [cr, cg, cb] = weightToColor(norm);
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`);
      grad.addColorStop(0.5, `rgba(${cr},${cg},${cb},${alpha * 0.4})`);
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);

      offCtx.globalCompositeOperation = 'lighter';
      offCtx.fillStyle = grad;
      offCtx.beginPath();
      offCtx.arc(px, py, r, 0, Math.PI * 2);
      offCtx.fill();
    }

    // Clamp very bright pixels using destination-in
    ctx.drawImage(offscreen, 0, 0);
  }, [mapId, points, maxWeight, intensity]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
}
