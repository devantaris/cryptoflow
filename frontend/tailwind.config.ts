import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#0A0F1C',
          900: '#0F172A',
          850: '#151F33',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
        },
        cyan: {
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
        },
        amber: {
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        emerald: {
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        crimson: {
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        },
        purple: {
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.35)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.4)',
        'glow-emerald': '0 0 20px rgba(52, 211, 153, 0.4)',
        'glow-crimson': '0 0 25px rgba(239, 68, 68, 0.5)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'laser-flow': 'laserFlow 1.2s linear infinite',
        'seal-pulse': 'sealPulse 2s ease-in-out infinite',
        'alarm-pulse': 'alarmPulse 0.6s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(34, 211, 238, 0.2)' },
          '50%': { boxShadow: '0 0 35px rgba(34, 211, 238, 0.55)' },
        },
        laserFlow: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        sealPulse: {
          '0%, 100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.4))' },
          '50%': { transform: 'scale(1.04)', filter: 'drop-shadow(0 0 24px rgba(245, 158, 11, 0.7))' },
        },
        alarmPulse: {
          '0%, 100%': { borderColor: 'rgba(239, 68, 68, 0.2)', boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)' },
          '50%': { borderColor: 'rgba(239, 68, 68, 0.9)', boxShadow: '0 0 30px rgba(239, 68, 68, 0.6)' },
        },
      }
    },
  },
  plugins: [],
} satisfies Config;
