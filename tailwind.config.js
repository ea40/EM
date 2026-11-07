/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /**
         * Surface ramp. `950` is the page void, `700` the highest raised panel.
         * Named by intent so panels stop reaching for raw slate greys.
         */
        navy: {
          950: '#060911',
          900: '#0B0F19',
          850: '#0F1524',
          800: '#141C2E',
          700: '#1E293B',
          600: '#334155'
        },
        /**
         * Triage semantics. `-soft` is the tinted surface for badges/rows;
         * the base value is the text/indicator colour.
         */
        triage: {
          red: '#EF4444',
          'red-soft': 'rgba(239, 68, 68, 0.12)',
          amber: '#F59E0B',
          'amber-soft': 'rgba(245, 158, 11, 0.12)',
          green: '#10B981',
          'green-soft': 'rgba(16, 185, 129, 0.12)',
          idle: '#64748B',
          'idle-soft': 'rgba(100, 116, 139, 0.12)'
        },
        emer: {
          red: '#EF4444',
          amber: '#F59E0B',
          cyan: '#06B6D4',
          emerald: '#10B981',
          purple: '#8B5CF6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace', {
          fontFeatureSettings: '"tnum" 1, "zero" 1'
        }]
      },
      /** Layered elevation — depth comes from stacked shadow + border, not one blur. */
      boxShadow: {
        'elev-1': '0 1px 2px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(148, 163, 184, 0.06)',
        'elev-2': '0 4px 12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(148, 163, 184, 0.07)',
        'elev-3': '0 18px 40px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(148, 163, 184, 0.08)',
        'glow-red': '0 0 0 1px rgba(239, 68, 68, 0.35), 0 0 24px -4px rgba(239, 68, 68, 0.45)',
        'glow-amber': '0 0 0 1px rgba(245, 158, 11, 0.3), 0 0 20px -6px rgba(245, 158, 11, 0.4)',
        'glow-cyan': '0 0 0 1px rgba(6, 182, 212, 0.3), 0 0 20px -6px rgba(6, 182, 212, 0.4)'
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)'
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'radar-sweep': 'radar 4s linear infinite',
        'fade-in': 'fadeIn 160ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'modal-in': 'modalIn 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'rise-in': 'riseIn 320ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'sweep-x': 'sweepX 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite'
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        modalIn: {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        sweepX: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' }
        }
      }
    },
  },
  plugins: [],
}
