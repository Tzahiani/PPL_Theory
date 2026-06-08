/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Segoe UI', 'Heebo', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      colors: {
        aviation: {
          navy: '#0a1628',
          slate: '#1e293b',
          sky: '#38bdf8',
          amber: '#f59e0b',
          runway: '#22c55e',
          alert: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
