/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        verse: {
          bg: '#07090E',
          card: '#0F1523',
          border: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.04)',
          cyan: '#00F0FF',
          purple: '#A855F7',
          indigo: '#6366F1',
          rose: '#F43F5E',
          amber: '#F59E0B',
          muted: '#94A3B8'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      backgroundImage: {
        'cosmic-gradient': 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), rgba(7, 9, 14, 0.95))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'neon-border': 'linear-gradient(90deg, #6366F1, #A855F7, #00F0FF)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%': { opacity: '0.4', filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))' },
          '100%': { opacity: '1', filter: 'drop-shadow(0 0 16px rgba(0, 240, 255, 0.8))' },
        }
      }
    },
  },
  plugins: [],
}
