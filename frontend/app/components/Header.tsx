'use client';

import { Share2, Download } from 'lucide-react';
import type { TabId } from '../types';

const TABS: { id: TabId; label: string }[] = [
  { id: 'map', label: 'MAP VIEW' },
  { id: 'heatmap', label: 'HEATMAPS' },
  { id: 'events', label: 'EVENTS' },
  { id: 'analytics', label: 'ANALYTICS' },
];

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isLoaded: boolean;
  totalRows: number;
}

export default function Header({ activeTab, onTabChange, isLoaded, totalRows }: Props) {
  return (
    <header className="flex items-center justify-between px-4 h-14 border-b border-bg-border2 bg-bg-dark shrink-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-widest text-txt-primary">
            LILA<span className="text-accent-blue">BLACK</span>
          </span>
          <span className="text-[10px] text-txt-secondary tracking-wider uppercase">
            Player Journey Visualizer
          </span>
        </div>
        <div className="w-px h-8 bg-bg-border2 mx-2" />
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${isLoaded ? 'bg-accent-green animate-pulse' : 'bg-accent-yellow animate-pulse'}`}
          />
          <span className="text-[11px] text-txt-secondary">
            {isLoaded ? `${totalRows.toLocaleString()} rows loaded` : 'Loading data…'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`px-4 py-1.5 text-xs font-semibold tracking-wider rounded transition-all ${
              activeTab === t.id
                ? 'bg-accent-blue text-white'
                : 'text-txt-secondary hover:text-txt-primary hover:bg-bg-card'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-txt-secondary border border-bg-border2 rounded hover:border-accent-blue hover:text-txt-primary transition-all">
          <Share2 size={12} />
          Share
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-txt-secondary border border-bg-border2 rounded hover:border-accent-blue hover:text-txt-primary transition-all">
          <Download size={12} />
          Export
        </button>
      </div>
    </header>
  );
}
