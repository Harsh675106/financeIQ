/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

/*
 * FinanceIQ — "Obsidian Aurora" design tokens
 *
 * - `slate` is re-tuned into a cool, ink-tinted neutral scale so every
 *   surface, border and muted text in the app shares one premium tone.
 *   Luminance steps mirror Tailwind's slate, so contrast ratios are kept.
 * - `primary` is the brand "iris" (indigo → violet). Emerald stays the
 *   semantic colour for gains / positive values, rose for losses.
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
        slate: {
          50: '#f7f8fc',
          100: '#eef0f8',
          200: '#dde1ef',
          300: '#bcc3db',
          400: '#9099b8',
          500: '#666f91',
          600: '#4a5170',
          700: '#323853',
          800: '#1f2339',
          900: '#121528',
          950: '#090b17',
        },
        primary: {
          50: '#f0f1ff',
          100: '#e3e5ff',
          200: '#cacdff',
          300: '#a9acff',
          400: '#8a88fb',
          500: '#7068f4',
          600: '#5f50e6',
          700: '#5041cb',
          800: '#4237a4',
          900: '#383381',
          950: '#221e4b',
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
        surface: {
          950: '#06070f',
          900: '#090b17',
          800: '#0e1121',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-primary': '0 0 0 1px rgba(112, 104, 244, 0.35), 0 10px 40px -10px rgba(112, 104, 244, 0.55)',
        'glow-emerald': '0 0 0 1px rgba(52, 211, 153, 0.3), 0 10px 36px -12px rgba(16, 185, 129, 0.5)',
        glass: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.4), 0 24px 48px -28px rgba(0, 0, 0, 0.8)',
        elevated: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 2px 4px 0 rgba(0, 0, 0, 0.35), 0 32px 64px -24px rgba(0, 0, 0, 0.85)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      // Keyframes and `animate-*` utilities live in app/globals.css so every
      // decorative animation can be gated behind prefers-reduced-motion.
    },
  },
  plugins: [],
}
