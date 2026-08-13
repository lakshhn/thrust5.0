import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

// Animated score digit counter (odometer-style)
function AnimatedScore({ value, className }) {
  const [prevValue, setPrevValue] = useState(value)
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (value !== prevValue) {
      setIsAnimating(true)
      const start = prevValue
      const end = value
      const duration = 600
      const startTime = performance.now()

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = Math.round(start + (end - start) * eased)
        setDisplayValue(current)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setDisplayValue(end)
          setIsAnimating(false)
          setPrevValue(end)
        }
      }

      requestAnimationFrame(animate)
    }
  }, [value, prevValue])

  return (
    <span
      className={className}
      style={{ fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' }}
      data-score
    >
      {displayValue}
    </span>
  )
}

// Score delta badge — shows "+N" after a rank-up
function ScoreDeltaBadge({ delta }) {
  return (
    <motion.span
      className="score-delta-badge"
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -10 }}
      transition={{ delay: 0.5, duration: 1 }}
      aria-label={`Score increased by ${delta}`}
    >
      +{delta}
    </motion.span>
  )
}

// Individual leaderboard row
function LeaderboardRow({ entry, prevRank, prevTotal }) {
  const rankChanged = prevRank !== undefined && prevRank !== entry.rank
  const movedUp = prevRank !== undefined && prevRank > entry.rank
  const scoreDelta = prevTotal !== undefined ? entry.total - prevTotal : 0

  return (
    <motion.tr
      layoutId={`row-${entry.id}`}
      layout="position"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`leaderboard-row ${movedUp ? 'leaderboard-row-rankup' : ''}`}
      role="row"
      aria-label={`Rank ${entry.rank}: ${entry.name}, total ${entry.total}`}
    >
      {/* Rank */}
      <td className="w-16 pl-4 pr-2">
        <div className="flex items-center gap-2">
          <span
            className="rank-number text-lg"
            data-rank
            style={{
              color: entry.rank <= 3 ? getRankColor(entry.rank) : 'var(--text-muted)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {entry.rank}
          </span>
          {/* Rank change indicator */}
          {rankChanged && (
            <span
              className={`text-[10px] font-bold ${movedUp ? '' : ''}`}
              style={{ color: movedUp ? 'var(--success)' : 'var(--text-faint)' }}
              aria-label={movedUp ? `Moved up from rank ${prevRank}` : `Moved down from rank ${prevRank}`}
            >
              {movedUp ? '▲' : '▼'}
            </span>
          )}
        </div>
      </td>

      {/* Team */}
      <td className="py-3 pr-4">
        <div>
          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            {entry.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
            {entry.code}
          </p>
        </div>
      </td>

      {/* Round scores */}
      {['round_1', 'round_2', 'round_3'].map((round) => (
        <td key={round} className="col-score text-right pr-4">
          <span
            className="text-sm score-cell"
            style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}
          >
            {entry[round] ?? '–'}
          </span>
        </td>
      ))}

      {/* Design marks */}
      <td className="col-score text-right pr-4">
        <span
          className="text-sm score-cell"
          style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}
        >
          {entry.design ?? '–'}
        </span>
      </td>

      {/* Total — prominent, animated */}
      <td className="col-score text-right pr-4 relative">
        <div className="relative inline-flex items-center">
          <AnimatedScore
            value={entry.total}
            className="font-semibold text-sm"
          />
          {/* Delta badge — appears after score update */}
          <AnimatePresence>
            {scoreDelta > 0 && (
              <ScoreDeltaBadge key={`delta-${entry.id}-${entry.total}`} delta={scoreDelta} />
            )}
          </AnimatePresence>
        </div>
      </td>
    </motion.tr>
  )
}

function getRankColor(rank) {
  if (rank === 1) return '#E8B84B' // gold
  if (rank === 2) return '#B8C0CC' // silver
  if (rank === 3) return '#CD7F3B' // bronze
  return 'var(--text-muted)'
}

/**
 * LeaderboardTable — virtualized, layout-animated table
 * Shows all teams below the podium (rank 4+)
 * Uses @tanstack/react-virtual for performance with large team counts
 */
export default function LeaderboardTable({ entries, searchQuery = '' }) {
  const parentRef = useRef(null)

  // Filter out top 3 (shown in podium) and apply search
  const filtered = entries
    .filter(e => e.rank > 3)
    .filter(e =>
      !searchQuery ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56, // estimated row height in px
    overscan: 5,
  })

  return (
    <div className="relative">
      {/* Table header — sticky */}
      <table className="leaderboard-table w-full" aria-label="Full leaderboard rankings">
        <thead>
          <tr role="row">
            <th className="w-16 pl-4 pr-2 text-left" scope="col">Rank</th>
            <th className="text-left pr-4" scope="col">Team</th>
            <th className="col-score text-right pr-4" scope="col">R1</th>
            <th className="col-score text-right pr-4" scope="col">R2</th>
            <th className="col-score text-right pr-4" scope="col">R3</th>
            <th className="col-score text-right pr-4" scope="col">Design</th>
            <th className="col-score text-right pr-4" scope="col">Total</th>
          </tr>
        </thead>
      </table>

      {/* Virtualized body */}
      <div
        ref={parentRef}
        className="overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 360px)', minHeight: '200px' }}
        role="region"
        aria-label="Team rankings list"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <table className="leaderboard-table w-full absolute top-0 left-0">
            <tbody>
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const entry = filtered[virtualItem.index]
                return (
                  <tr
                    key={entry.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="leaderboard-row"
                    role="row"
                    aria-label={`Rank ${entry.rank}: ${entry.name}, total ${entry.total}`}
                  >
                    {/* Rank */}
                    <td className="w-16 pl-4 pr-2">
                      <span
                        className="rank-number text-lg"
                        data-rank
                        style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {entry.rank}
                      </span>
                    </td>
                    {/* Team */}
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          {entry.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                          {entry.code}
                        </p>
                      </div>
                    </td>
                    {/* Scores */}
                    {['round_1', 'round_2', 'round_3'].map((round) => (
                      <td key={round} className="col-score text-right pr-4">
                        <span
                          className="text-sm score-cell"
                          style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}
                        >
                          {entry[round] ?? '–'}
                        </span>
                      </td>
                    ))}
                    <td className="col-score text-right pr-4">
                      <span className="text-sm score-cell" style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {entry.design ?? '–'}
                      </span>
                    </td>
                    <td className="col-score text-right pr-4">
                      <span
                        className="font-semibold text-sm score-cell"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                        data-score
                      >
                        {entry.total}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="py-16 text-center" style={{ color: 'var(--text-muted)' }}>
          {searchQuery
            ? `No teams matching "${searchQuery}"`
            : 'No teams to display.'}
        </div>
      )}
    </div>
  )
}
