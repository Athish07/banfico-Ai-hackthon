/** @type {import('tailwindcss').Config} */

// ─────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH FOR THE BANFICO THEME.
// Derived from the Banfico logo (deep navy mark + teal crescent)
// and the mid-blue used for headings in their documents.
// If the organizers give you exact brand hexes, change them here
// and nowhere else.
// ─────────────────────────────────────────────────────────────

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B2135', // sidebar, hero panel
          800: '#0F2A43',
          700: '#16385A',
          600: '#1E4A73',
        },
        teal: {
          600: '#0F8A80',
          500: '#17A398', // primary accent — the logo crescent
          400: '#22C3AF',
          100: '#DCF4F1',
        },
        brandblue: {
          600: '#2361A0',
          500: '#2E7BB8', // Banfico document heading blue
          100: '#E4EFF8',
        },
        slate: {
          // overrides Tailwind's slate with warmer, bank-grade greys
          50: '#F5F7FA',
          100: '#EBEFF4',
          200: '#DBE2EA',
          400: '#8B9AAB',
          500: '#5A6B7C',
          600: '#41536A',
        },
        alert: '#E0913A',
        danger: '#CF4F4A',
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,33,53,.04), 0 8px 24px -12px rgba(11,33,53,.14)',
        rail: '0 1px 2px rgba(11,33,53,.04), 0 12px 32px -16px rgba(23,163,152,.28)',
      },
      borderRadius: {
        card: '14px',
      },
      keyframes: {
        rise: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%,100%': { opacity: 0.35 },
          '50%': { opacity: 1 },
        },
      },
      animation: {
        rise: 'rise .4s cubic-bezier(.22,.8,.3,1) both',
        pulseDot: 'pulseDot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
