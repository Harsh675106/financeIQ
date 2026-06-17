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
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        surface: {
          950: '#020617',
          900: '#020817',
          800: '#020c1f',
        },
      },
      boxShadow: {
        'glow-primary': '0 0 40px rgba(16, 185, 129, 0.35)',
      },
      keyframes: {
        'float-soft': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'blob-move': {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(20px, -30px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 10px) scale(0.98)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.3))' },
          '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.6))' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'rotate-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)' },
          '50%': { boxShadow: '0 0 0 10px rgba(16, 185, 129, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
        },
        'flip': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      animation: {
        'float-soft': 'float-soft 14s ease-in-out infinite',
        'fade-up': 'fade-up 500ms ease-out both',
        'fade-in': 'fade-in 350ms ease-out both',
        'blob-slow': 'blob-move 28s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 600ms ease-out',
        'slide-in-right': 'slide-in-right 600ms ease-out',
        'scale-in': 'scale-in 500ms ease-out',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'rotate-slow': 'rotate-slow 20s linear infinite',
        'pulse-ring': 'pulse-ring 2s infinite',
        'flip': 'flip 3s ease-in-out infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
