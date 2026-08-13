/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === AFC BRAND COLOR PALETTE (From AFC IIITDMJ Logo) ===
        'bg-base':      '#070A0F',  // Ultra dark space black with blue tint
        'bg-surface':   '#0D131F',  // Deep aerospace navy card background
        'bg-elevated':  '#141C2E',  // Elevated surface for panels
        'afc-cyan':     '#29ABE2',  // Core AFC Electric Cyan
        'afc-blue':     '#1E6FBA',  // Core AFC Royal Blue
        'afc-glow':     '#00D2FF',  // High-intensity neon cyan
        'ignition':     '#FF5A1F',  // Rocket launch orange accent
        'gold':         '#FFD700',  // Rank #1
        'silver':       '#E2E8F0',  // Rank #2
        'bronze':       '#CD7F3B',  // Rank #3
        'text-primary': '#F8FAFC',  // Crisp white
        'text-muted':   '#94A3B8',  // Cool gray
        'text-faint':   '#475569',  // Subtle slate
        'success':      '#10B981',  // Live sync status
        'danger':       '#EF4444',  // Error
        'border-subtle':'#1E293B',  // Subtle border
        'border-mid':   '#334155',  // Highlight border
        'border-glow':  'rgba(41, 171, 226, 0.4)',
      },
      fontFamily: {
        'display': ['"Space Grotesk"', '"Bebas Neue"', 'sans-serif'],
        'mono-display': ['"Space Grotesk"', 'monospace'],
        'body': ['"Inter"', 'sans-serif'],
      },
      fontSize: {
        'rank-xl':  ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'rank-lg':  ['3rem', { lineHeight: '1' }],
        'score-xl': ['2.25rem', { lineHeight: '1' }],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'rocket-thrust': 'rocket-thrust 3s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'rotor-spin': 'rotor-spin 0.4s linear infinite',
        'glider-sweep': 'glider-sweep 14s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', filter: 'drop-shadow(0 0 12px rgba(41, 171, 226, 0.6))' },
          '50%': { opacity: '0.9', filter: 'drop-shadow(0 0 24px rgba(0, 210, 255, 0.9))' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(1deg)' },
        },
        'rotor-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'glider-sweep': {
          '0%': { transform: 'translate(-10%, 20px) rotate(-2deg)', opacity: '0' },
          '15%': { opacity: '0.35' },
          '85%': { opacity: '0.35' },
          '100%': { transform: 'translate(110vw, -40px) rotate(3deg)', opacity: '0' },
        },
      },
      boxShadow: {
        'afc-cyan': '0 0 20px rgba(41, 171, 226, 0.25)',
        'afc-glow': '0 0 30px rgba(0, 210, 255, 0.4)',
        'podium-gold': '0 0 25px rgba(255, 215, 0, 0.3)',
        'podium-silver': '0 0 20px rgba(226, 232, 240, 0.2)',
        'podium-bronze': '0 0 20px rgba(205, 127, 59, 0.25)',
      },
    },
  },
  plugins: [],
}
