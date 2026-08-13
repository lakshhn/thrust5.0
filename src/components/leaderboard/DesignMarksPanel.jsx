/**
 * DesignMarksPanel — compact secondary leaderboard ranking teams by design score
 * Lives in the right sidebar on desktop, second tab on mobile
 */
export default function DesignMarksPanel({ entries }) {
  // Sort by design score, descending
  const ranked = [...entries]
    .sort((a, b) => b.design - a.design)
    .map((entry, idx) => ({ ...entry, designRank: idx + 1 }))

  return (
    <aside
      className="design-marks-panel p-4"
      aria-label="Design Marks leaderboard"
    >
      {/* Panel header */}
      <div className="mb-4">
        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: 'var(--text-faint)' }}
        >
          Design Marks
        </h2>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Teams ranked by design score
        </p>
      </div>

      {/* Design marks list */}
      <div className="space-y-1">
        {ranked.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 py-2 px-2 rounded-md transition-colors hover:bg-opacity-50"
            style={{ backgroundColor: 'transparent' }}
            role="row"
            aria-label={`Design rank ${entry.designRank}: ${entry.name}, score ${entry.design}`}
          >
            {/* Design rank */}
            <span
              className="rank-number text-sm w-6 text-right flex-shrink-0"
              style={{
                color: entry.designRank <= 3
                  ? getDesignRankColor(entry.designRank)
                  : 'var(--text-faint)',
                fontVariantNumeric: 'tabular-nums',
              }}
              data-rank
            >
              {entry.designRank}
            </span>

            {/* Team name */}
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {entry.name}
              </p>
              <p
                className="text-[10px] truncate"
                style={{ color: 'var(--text-faint)' }}
              >
                {entry.code}
              </p>
            </div>

            {/* Design score */}
            <span
              className="text-sm font-semibold score-cell flex-shrink-0"
              style={{
                fontVariantNumeric: 'tabular-nums',
                color: entry.designRank === 1 ? 'var(--gold)' : 'var(--text-primary)',
              }}
              data-score
            >
              {entry.design}
            </span>
          </div>
        ))}
      </div>

      {/* Footer label */}
      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
          Max 25 points
        </p>
      </div>
    </aside>
  )
}

function getDesignRankColor(rank) {
  if (rank === 1) return '#E8B84B'
  if (rank === 2) return '#B8C0CC'
  if (rank === 3) return '#CD7F3B'
  return 'var(--text-faint)'
}
