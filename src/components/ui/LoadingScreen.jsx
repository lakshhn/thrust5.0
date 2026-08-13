/**
 * LoadingScreen — initial loading state while lazy chunks load
 * Uses display font for brand identity even in loading state
 */
export default function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-6"
      style={{ backgroundColor: 'var(--bg-base)' }}
      role="status"
      aria-label="Loading Thrust 5.0 leaderboard"
    >
      {/* Wordmark */}
      <div className="text-center">
        <h1
          className="display-text text-5xl md:text-7xl tracking-widest"
          style={{ color: 'var(--text-primary)' }}
        >
          THRUST 5.0
        </h1>
        <p
          className="text-sm mt-2 tracking-widest uppercase"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.25em' }}
        >
          Aero Fabrication Club
        </p>
      </div>

      {/* Loading bar */}
      <div
        className="w-32 h-[2px] rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--border-mid)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            backgroundColor: 'var(--ignition)',
            animation: 'loading-bar 1.5s ease-in-out infinite',
            width: '40%',
          }}
        />
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  )
}
