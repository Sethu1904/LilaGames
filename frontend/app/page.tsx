'use client';

import { useEffect, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/tabs/MapView';
import Heatmaps from './components/tabs/Heatmaps';
import Events from './components/tabs/Events';
import Analytics from './components/tabs/Analytics';
import { useFilters } from './hooks/useFilters';
import { api } from './lib/api';
import type { TabId } from './types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('map');
  const { filters, applied, update, apply, reset, toggleEventType } = useFilters();
  const [isLoaded, setIsLoaded] = useState(false);
  const [totalRows, setTotalRows] = useState(0);

  // Poll health until data is loaded
  useEffect(() => {
    const poll = async () => {
      try {
        const h = await api.health();
        setTotalRows(h.total_rows);
        if (h.loaded && h.total_rows > 0) {
          setIsLoaded(true);
          clearInterval(interval);
        }
      } catch {
        // backend not ready yet
      }
    };
    const interval = setInterval(poll, 2000);
    poll();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0a0e1a]">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLoaded={isLoaded}
        totalRows={totalRows}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          filters={filters}
          onUpdate={update}
          onApply={apply}
          onReset={reset}
          onToggleEventType={toggleEventType}
          activeTab={activeTab}
        />

        <main className="flex flex-1 overflow-hidden">
          {activeTab === 'map' && <MapView filters={applied} />}
          {activeTab === 'heatmap' && <Heatmaps filters={applied} />}
          {activeTab === 'events' && <Events filters={applied} />}
          {activeTab === 'analytics' && <Analytics filters={applied} />}
        </main>
      </div>
    </div>
  );
}
