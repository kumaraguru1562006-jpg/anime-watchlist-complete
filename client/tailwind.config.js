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
        background: '#070913',
        surface: 'rgba(15, 23, 42, 0.65)',
        'surface-border': 'rgba(255, 255, 255, 0.12)',
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          DEFAULT: '#8b5cf6',
        },
        accent: {
          cyan: '#00f2fe',
          pink: '#f43f5e',
          amber: '#fbbf24',
          emerald: '#10b981',
        }
      },
      backdropBlur: {
        xs: '2px',
        glass: '24px',
        liquid: '32px',
      },
      animation: {
        'liquid-pulse': 'liquidPulse 8s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2.5s linear infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        liquidPulse: {
          '0%': { transform: 'scale(1) rotate(0deg)', opacity: '0.6' },
          '100%': { transform: 'scale(1.15) rotate(15deg)', opacity: '0.85' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
