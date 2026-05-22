/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          darkest: '#0a0e1a',
          dark: '#0f1629',
          sidebar: '#0d1526',
          card: '#1a2035',
          border: '#1e2a3e',
          border2: '#243048',
        },
        accent: {
          blue: '#3b82f6',
          red: '#ef4444',
          green: '#22c55e',
          yellow: '#f59e0b',
          purple: '#8b5cf6',
          orange: '#f97316',
          pink: '#ec4899',
        },
        txt: {
          primary: '#e2e8f0',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
