/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

/*
 * FinanceIQ — "Mint & Ice" light design tokens
 *
 * - `ink`      deep teal-ink scale for primary text and headings (#172B2A @ 900).
 * - `slate`    Tailwind default; slate-500 (#64748B) is the secondary text colour.
 * - `primary`  brand emerald (fresh mint → deep emerald).
 * - `ice`      ice / sky blue secondary accent (same values as Tailwind `sky`).
 * - `canvas`   page backgrounds, `line` hairline borders.
 * Semantics: emerald = gains / positive, rose = losses, amber/orange = caution,
 * sky/ice = information & secondary series, indigo = AI features.
 * Keyframes and `animate-*` utilities live in app/globals.css (motion-gated).
 */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-display)', 'var(--font-sans)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },
      colors: {
        ink: {
          50: '#f4f8f7',
          100: '#e6eeec',
          200: '#cbd8d5',
          300: '#a3b4b1',
          400: '#7c8c8a',
          500: '#5e6e6c',
          600: '#4a5a58',
          700: '#364644',
          800: '#243533',
          900: '#172b2a',
          950: '#0d1b1a',
        },
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
          950: '#022c22',
        },
        ice: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        canvas: {
          DEFAULT: '#f7fbfa',
          subtle: '#eff8f6',
          muted: '#e8f3f0',
        },
        line: {
          DEFAULT: '#e2eeea',
          strong: '#d3e4df',
        },
        success: {
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
        danger: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(16, 40, 38, 0.05)',
        card: '0 1px 2px 0 rgba(16, 40, 38, 0.04), 0 4px 16px -6px rgba(16, 40, 38, 0.08)',
        'card-hover': '0 2px 4px 0 rgba(16, 40, 38, 0.05), 0 16px 32px -12px rgba(16, 40, 38, 0.14)',
        float: '0 12px 40px -12px rgba(16, 40, 38, 0.22), 0 2px 6px -2px rgba(16, 40, 38, 0.08)',
        'glow-primary': '0 8px 24px -10px rgba(5, 150, 105, 0.55)',
        'glow-ice': '0 8px 24px -10px rgba(14, 165, 233, 0.5)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
