/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./apps/renderer/index.html', './apps/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Body text default, per YiSoft's system (Inter for everything but headings).
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Headings only (Display through H3), per YiSoft's typographic guide.
        display: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // YiSoft azul (#1B4965) — titles, primary brand accent.
        brand: {
          50: '#eef4f7',
          100: '#d7e5ea',
          200: '#b0ccd6',
          300: '#82adc0',
          400: '#4f88a3',
          500: '#2f6c8a',
          600: '#1B4965',
          700: '#163b52',
          800: '#122f42',
          900: '#0f2735',
          950: '#0a1a24',
        },
        // YiSoft verde (#2EC486) — links, buttons, actions/CTAs.
        accent: {
          50: '#eafcf5',
          100: '#c9f7e3',
          200: '#96eecb',
          300: '#5fe0af',
          400: '#37cf99',
          500: '#2EC486',
          600: '#22a06c',
          700: '#1c7f57',
          800: '#186647',
          900: '#15533b',
          950: '#0a2f22',
        },
        ink: '#222831',
        muted: '#5B6770',
        'muted-dark': '#9FB3BF',
        paper: '#F7F9FA',
        carbon: '#101820',
      },
    },
  },
  plugins: [],
};
