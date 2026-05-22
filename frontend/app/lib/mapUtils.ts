import type { MapConfig } from '../types';

export const MAP_CONFIGS: Record<string, MapConfig> = {
  AmbroseValley: { scale: 900, originX: -370, originZ: -473 },
  GrandRift: { scale: 581, originX: -290, originZ: -290 },
  Lockdown: { scale: 1000, originX: -500, originZ: -500 },
};

export function worldToCanvas(
  x: number,
  z: number,
  mapConfig: MapConfig,
  canvasWidth: number,
  canvasHeight: number
): { px: number; py: number } {
  const u = (x - mapConfig.originX) / mapConfig.scale;
  const v = (z - mapConfig.originZ) / mapConfig.scale;
  return {
    px: u * canvasWidth,
    py: (1 - v) * canvasHeight,
  };
}

export const MAP_COLORS: Record<string, string> = {
  AmbroseValley: '#22c55e',
  GrandRift: '#3b82f6',
  Lockdown: '#f59e0b',
};

export const EVENT_COLORS: Record<string, string> = {
  Kill: '#ef4444',
  Killed: '#e2e8f0',
  BotKill: '#f97316',
  BotKilled: '#ec4899',
  KilledByStorm: '#8b5cf6',
  Loot: '#f59e0b',
  Position: '#3b82f6',
  BotPosition: '#ef4444',
};

export const EVENT_LABELS: Record<string, string> = {
  Kill: 'Kill',
  Killed: 'Death',
  BotKill: 'Bot Kill',
  BotKilled: 'Bot Death',
  KilledByStorm: 'Storm Death',
  Loot: 'Loot',
  Position: 'Movement',
  BotPosition: 'Bot Movement',
};

export function drawEventMarker(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  event: string,
  radius = 6
) {
  ctx.save();
  ctx.translate(px, py);

  switch (event) {
    case 'Kill':
    case 'BotKill': {
      // Red/orange skull-like X
      const color = event === 'Kill' ? '#ef4444' : '#f97316';
      ctx.strokeStyle = color;
      ctx.fillStyle = color + '44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.5, -radius * 0.5);
      ctx.lineTo(radius * 0.5, radius * 0.5);
      ctx.moveTo(radius * 0.5, -radius * 0.5);
      ctx.lineTo(-radius * 0.5, radius * 0.5);
      ctx.stroke();
      break;
    }
    case 'Killed':
    case 'BotKilled': {
      const color = event === 'Killed' ? '#e2e8f0' : '#ec4899';
      ctx.fillStyle = color + '66';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Down arrow
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.5);
      ctx.lineTo(0, radius * 0.5);
      ctx.moveTo(-radius * 0.4, radius * 0.1);
      ctx.lineTo(0, radius * 0.5);
      ctx.lineTo(radius * 0.4, radius * 0.1);
      ctx.stroke();
      break;
    }
    case 'KilledByStorm': {
      ctx.fillStyle = '#8b5cf666';
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Lightning bolt
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(2, -radius * 0.6);
      ctx.lineTo(-1, 0);
      ctx.lineTo(1, 0);
      ctx.lineTo(-2, radius * 0.6);
      ctx.stroke();
      break;
    }
    case 'Loot': {
      ctx.fillStyle = '#f59e0b66';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      // Star
      const spikes = 5;
      const outerR = radius;
      const innerR = radius * 0.4;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const sx = Math.cos(angle) * r;
        const sy = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    default: {
      ctx.fillStyle = '#94a3b844';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}
