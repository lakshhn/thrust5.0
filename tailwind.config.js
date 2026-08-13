/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === THRUST 5.0 BRAND PALETTE ===
        // Extracted from placeholder palette (Design Doc §2.2)
        // Replace with logo-extracted values once logo is delivered
        'bg-base':      '#0B0E14',  // Page background — near-black, slight blue undertone
        'bg-surface':   '#12161F',  // Card/panel surface
        'bg-elevated':  '#1A1F2E',  // Elevated surface (popovers, modals)
        'ignition':     '#FF5A1F',  // Primary accent — rank-up, live pulse, CTA
        'ignition-dim': '#CC421A',  // Darker ignition for hover states
        'thrust-blue':  '#2E7DFF',  // Secondary — links, active tabs
        'thrust-blue-dim': '#1E5FCC', // Darker blue for hover
        'gold':         '#E8B84B',  // Rank #1 — used sparingly
        'silver':       '#B8C0CC',  // Rank #2
        'bronze':       '#CD7F3B',  // Rank #3
        'text-primary': '#F4F5F7',  // Primary text
        'text-muted':   '#8A93A6',  // Secondary/meta text
        'text-faint':   '#4A5568',  // Very subtle/disabled text
        'success':      '#3ECF8E',  // Sync-OK / live indicator
        'success-dim':  '#2A8F60',  // Darker success for borders
        'danger':       '#E5484D',  // Sync error / disconnected state
        'danger-dim':   '#B03538',  // Darker danger for borders
        'border-subtle':'#1E2535',  // Subtle dividers
        'border-mid':   '#2A3147',  // Mid-weight borders
      },
      fontFamily: {
        // Display face for "Thrust 5.0" and "Aero Fabrication Club"
        'display': ['"Bebas Neue"', '"Archivo Black"', 'system-ui', 'sans-serif'],
        // Condensed variant for rank numbers
        'mono-display': ['"Bebas Neue"', 'monospace'],
        // Body/UI workhorse — Inter for labels, forms, table content
        'body': ['"Inter"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'rank-xl':  ['5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'rank-lg':  ['3.5rem', { lineHeight: '1', letterSpacing: '-0.01em' }],
        'rank-md':  ['2rem', { lineHeight: '1' }],
        'score-xl': ['2.5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      animation: {
        'pulse-live': 'pulse-live 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-reconnect': 'pulse-reconnect 1s ease-in-out infinite',
        'rank-up-flash': 'rank-up-flash 1.5s ease-out forwards',
        'fade-out': 'fade-out 1.5s ease-out forwards',
      },
      keyframes: {
        'pulse-live': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'pulse-reconnect': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.95)' },
        },
        'rank-up-flash': {
          '0%': { boxShadow: '0 0 0 0 rgba(255, 90, 31, 0.4)' },
          '70%': { boxShadow: '0 0 0 8px rgba(255, 90, 31, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255, 90, 31, 0)' },
        },
        'fade-out': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '70%': { opacity: '1', transform: 'translateY(-4px)' },
          '100%': { opacity: '0', transform: 'translateY(-8px)' },
        },
      },
      boxShadow: {
        'surface': '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)',
        'surface-lg': '0 4px 24px -4px rgba(0,0,0,0.5)',
        'podium-gold': '0 0 0 2px rgba(232,184,75,0.4), 0 4px 24px -4px rgba(232,184,75,0.2)',
        'podium-silver': '0 0 0 2px rgba(184,192,204,0.3), 0 4px 24px -4px rgba(184,192,204,0.1)',
        'podium-bronze': '0 0 0 2px rgba(205,127,59,0.3), 0 4px 24px -4px rgba(205,127,59,0.1)',
        'ignition-glow': '0 0 0 2px rgba(255,90,31,0.4)',
      },
    },
  },
  plugins: [],
}
