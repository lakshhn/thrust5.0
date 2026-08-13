import { motion, AnimatePresence } from 'framer-motion'

const RANK_LABELS = { 1: '1ST', 2: '2ND', 3: '3RD' }
const RANK_COLORS = {
  1: { accent: '#E8B84B', cardClass: 'podium-gold',   label: 'gold',   height: 'h-72 md:h-80' },
  2: { accent: '#B8C0CC', cardClass: 'podium-silver', label: 'silver', height: 'h-64 md:h-72' },
  3: { accent: '#CD7F3B', cardClass: 'podium-bronze', label: 'bronze', height: 'h-56 md:h-64' },
}

/**
 * PodiumCard — elevated hero card for top-3 teams
 * Rank 1 is always tallest; rank 2 and 3 are slightly shorter
 */
function PodiumCard({ entry, delay = 0 }) {
  const { rank, name, code, total, round_1, round_2, round_3, design } = entry
  const { accent, cardClass, height } = RANK_COLORS[rank]
  const rankLabel = RANK_LABELS[rank]

  return (
    <motion.div
      layoutId={`podium-${entry.id}`}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{
        delay,
        type: 'spring',
        stiffness: 280,
        damping: 28,
      }}
      className={`card card-elevated ${cardClass} flex flex-col justify-between ${height} p-5 relative overflow-hidden`}
      role="article"
      aria-label={`Rank ${rank}: ${name}`}
    >
      {/* Rank badge — top left */}
      <div className="flex items-center gap-2">
        <span
          className="display-text text-4xl leading-none"
          style={{ color: accent }}
          aria-label={`Ranked ${rankLabel}`}
        >
          {rankLabel}
        </span>
      </div>

      {/* Team identity — middle */}
      <div className="flex-1 flex flex-col justify-center gap-1 mt-3">
        <p className="text-xs font-mono text-muted uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {code}
        </p>
        <h2 className="font-semibold text-primary text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>
          {name}
        </h2>
      </div>

      {/* Score breakdown — bottom */}
      <div className="mt-4">
        {/* Total score — hero number */}
        <div
          className="rank-number score-cell text-4xl leading-none mb-3"
          data-score
          style={{ color: accent, fontVariantNumeric: 'tabular-nums' }}
          aria-label={`Total score: ${total}`}
        >
          {total}
        </div>
        {/* Per-round breakdown */}
        <div className="grid grid-cols-4 gap-1">
          {[
            { label: 'R1', value: round_1 },
            { label: 'R2', value: round_2 },
            { label: 'R3', value: round_3 },
            { label: 'DM', value: design },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p
                className="text-xs score-cell"
                style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}
              >
                {value ?? '–'}
              </p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Subtle rank number watermark in background */}
      <div
        className="display-text absolute -right-3 -bottom-6 text-[7rem] leading-none select-none pointer-events-none opacity-[0.04]"
        aria-hidden="true"
        style={{ color: accent }}
      >
        {rank}
      </div>
    </motion.div>
  )
}

/**
 * PodiumBlock — the hero section showing the top 3 teams
 * Visual order: 2nd | 1st | 3rd (classic podium arrangement)
 */
export default function PodiumBlock({ entries }) {
  if (!entries || entries.length === 0) return null

  const top3 = entries.slice(0, 3)
  const first  = top3.find(e => e.rank === 1)
  const second = top3.find(e => e.rank === 2)
  const third  = top3.find(e => e.rank === 3)

  // Visual order: 2nd, 1st, 3rd
  const visualOrder = [second, first, third].filter(Boolean)

  return (
    <section aria-label="Podium — Top 3 teams">
      <div className="grid grid-cols-3 gap-3 p-4 md:p-6">
        <AnimatePresence mode="popLayout">
          {visualOrder.map((entry, idx) => (
            <PodiumCard
              key={entry.id}
              entry={entry}
              delay={idx * 0.12}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  )
}
