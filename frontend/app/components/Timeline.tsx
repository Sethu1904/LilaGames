'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronRight } from 'lucide-react';
import type { EventPoint } from '../types';

const EVENT_ICONS: Record<string, string> = {
  Kill: '⚔',
  Killed: '💀',
  BotKill: '🤖',
  BotKilled: '🔴',
  KilledByStorm: '⚡',
  Loot: '⭐',
};

const EVENT_COLORS: Record<string, string> = {
  Kill: '#ef4444',
  Killed: '#e2e8f0',
  BotKill: '#f97316',
  BotKilled: '#ec4899',
  KilledByStorm: '#8b5cf6',
  Loot: '#f59e0b',
};

interface Props {
  events: EventPoint[];
  onProgressChange?: (progress: number) => void;
}

const SPEEDS = [0.5, 1, 2, 4];

export default function Timeline({ events, onProgressChange }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const speed = SPEEDS[speedIdx];

  const tick = useCallback(() => {
    setProgress((p) => {
      const next = Math.min(p + 0.002 * speed, 1);
      if (next >= 1) setIsPlaying(false);
      return next;
    });
  }, [speed]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(tick, 50);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, tick]);

  useEffect(() => {
    onProgressChange?.(progress);
  }, [progress, onProgressChange]);

  const totalSecs = events.length > 0 ? (events[events.length - 1]?.ts_seconds ?? 0) : 0;
  const currentSecs = Math.floor(progress * totalSecs);
  const mm = String(Math.floor(currentSecs / 60)).padStart(2, '0');
  const ss = String(currentSecs % 60).padStart(2, '0');
  const endMm = String(Math.floor(totalSecs / 60)).padStart(2, '0');
  const endSs = String(Math.floor(totalSecs % 60)).padStart(2, '0');

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgress(Number(e.target.value) / 1000);
    setIsPlaying(false);
  };

  const reset = () => {
    setProgress(0);
    setIsPlaying(false);
  };

  const stepForward = () => {
    setProgress((p) => Math.min(p + 0.05, 1));
  };

  // Generate event markers on timeline
  const eventMarkers = events.slice(0, 100).map((ev) => {
    const pct = totalSecs > 0 ? ((ev.ts_seconds ?? 0) / totalSecs) * 100 : 0;
    return { pct, event: ev.event, id: ev.ts };
  });

  return (
    <div className="h-16 bg-bg-dark border-t border-bg-border2 flex flex-col px-4 py-2 shrink-0">
      {/* Controls row */}
      <div className="flex items-center gap-3">
        {/* Speed selector */}
        <div className="flex items-center gap-1">
          {SPEEDS.map((s, i) => (
            <button
              key={s}
              onClick={() => setSpeedIdx(i)}
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                speedIdx === i
                  ? 'bg-accent-blue text-white'
                  : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Transport buttons */}
        <button
          onClick={reset}
          className="text-txt-secondary hover:text-txt-primary transition-colors"
        >
          <SkipBack size={14} />
        </button>
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="w-7 h-7 rounded-full bg-accent-blue flex items-center justify-center hover:bg-blue-600 transition-colors"
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <button
          onClick={stepForward}
          className="text-txt-secondary hover:text-txt-primary transition-colors"
        >
          <SkipForward size={14} />
        </button>

        {/* Time display */}
        <span className="text-[11px] font-mono text-txt-secondary">
          {mm}:{ss} / {endMm}:{endSs}
        </span>

        {/* Scrubber */}
        <div className="flex-1 relative">
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(progress * 1000)}
            onChange={handleScrub}
            className="w-full"
          />
          {/* Event marker dots */}
          {eventMarkers.map((em) => (
            <span
              key={em.id}
              title={em.event}
              className="absolute top-0 -translate-y-px pointer-events-none"
              style={{
                left: `${em.pct}%`,
                color: EVENT_COLORS[em.event] || '#94a3b8',
                fontSize: '7px',
              }}
            >
              ▲
            </span>
          ))}
        </div>

        {/* Event count */}
        <span className="text-[10px] text-txt-muted">{events.length} events</span>
      </div>
    </div>
  );
}
