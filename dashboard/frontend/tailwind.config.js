/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#07090e',
          panel: 'rgba(13, 19, 31, 0.88)',
          card: 'rgba(18, 25, 42, 0.7)',
          border: 'rgba(0, 240, 255, 0.25)',
          green: '#00ff66',
          cyan: '#00f0ff',
          red: '#ff003c',
          amber: '#ffb700',
          purple: '#b026ff',
        }
      },
      fontFamily: {
        hud: ['Orbitron', 'sans-serif'],
        mono: ['Share Tech Mono', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.2)',
        'glow-green': '0 0 10px rgba(0, 255, 102, 0.5), 0 0 20px rgba(0, 255, 102, 0.2)',
        'glow-red': '0 0 12px rgba(255, 0, 60, 0.6), 0 0 25px rgba(255, 0, 60, 0.3)',
      }
    },
  },
  plugins: [],
};
