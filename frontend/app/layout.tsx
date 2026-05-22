import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LILA BLACK – Player Journey Visualizer',
  description: 'Game telemetry visualization for LILA BLACK',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen w-screen overflow-hidden bg-[#0a0e1a] text-[#e2e8f0]">
        {children}
      </body>
    </html>
  );
}
