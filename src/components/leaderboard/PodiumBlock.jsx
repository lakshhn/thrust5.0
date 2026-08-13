import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Award } from 'lucide-react'

const RANK_LABELS = { 1: '1ST', 2: '2ND', 3: '3RD' }
const RANK_CONFIG = {
  1: { accent: '#FFD700', border: 'rgba(255, 215, 0, 0.45)', cardClass: 'podium-gold-cyber', label: '1st Place', height: 'h-64 sm:h-72 md:h-80' },
  2: { accent: '#E2E8F0', border: 'rgba(226, 232, 240, 0.35)', cardClass: 'podium-silver-cyber', label: '2nd Place', height: 'h-56 sm:h-64 md:h-72' },
  3: { accent: '#CD7F3B', border: 'rgba(205, 127, 59, 0.35)', cardClass: 'podium-bronze-cyber', label: '3rd Place', height: 'h-48 sm:h-56 md:h-64' },
}

function PodiumCard({ entry, delay = 0, viewMode = 'overall' }) {
  const { rank, name, code, total, round_1, round_2, round_3, design } = entry
  const config = RANK_CONFIG[rank] || RANK_CONFIG[3]
  const displayScore = viewMode === 'design' ? design : total

  return (
    <motion.div
      layoutId={`podium-${entry.id}`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 24 }}
      className={`card card-cyber ${config.cardClass} flex flex-col justify-between ${config.height} p-3.5 sm:p-5 relative overflow-hidden`}
      role="article"
      aria-label={`Rank ${rank}: ${name}`}
    >
      {/* Top Header Badge */}
      <div className="flex items-center justify-between">
        <span
          className="display-text text-2xl sm:text-4xl leading-none flex items-center gap-1"
          style={{ color: config.accent }}
        >
          {rank === 1 && <Trophy size={18} className="text-yellow-400 inline sm:hidden md:inline" />}
          {RANK_LABELS[rank]}
        </span>
        <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-[#070A0F]/80 text-slate-400 border border-slate-700/50">
          {code}
        </span>
      </div>

      {/* Team Name */}
      <div className="my-auto py-1">
        <h2 className="font-bold text-slate-100 text-sm sm:text-base md:text-lg leading-tight line-clamp-2">
          {name}
        </h2>
      </div>

      {/* Score Section */}
      <div>
        <div className="flex items-baseline gap-1 mb-2">
          <span
            className="rank-number text-2xl sm:text-4xl font-extrabold tracking-tight"
            style={{ color: config.accent }}
            data-score
          >
            {displayScore}
          </span>
          <span className="text-[10px] uppercase text-slate-400 font-medium">
            {viewMode === 'design' ? 'pts (Design)' : 'pts total'}
          </span>
        </div>

        {/* Per-Round Mini Matrix (Desktop & Mobile) */}
        {viewMode === 'overall' && (
          <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-800/80">
            <div className="text-center">
              <p className="text-[11px] font-semibold text-slate-300">{round_1 ?? 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">R1</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-semibold text-slate-300">{round_2 ?? 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">R2</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-semibold text-slate-300">{round_3 ?? 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">R3</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-semibold text-cyan-400">{design ?? 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">DES</p>
            </div>
          </div>
        )}
      </div>

      {/* Background Watermark Rank Number */}
      <div
        className="display-text absolute -right-2 -bottom-4 text-7xl sm:text-8xl select-none pointer-events-none opacity-[0.05]"
        style={{ color: config.accent }}
        aria-hidden="true"
      >
        {rank}
      </div>
    </motion.div>
  )
}

export default function PodiumBlock({ entries, viewMode = 'overall' }) {
  if (!entries || entries.length === 0) return null

  // Sort according to active view mode (Overall total or Design score)
  const sorted = [...entries].sort((a, b) => {
    return viewMode === 'design' ? (b.design - a.design) : (b.total - a.total)
  })

  const top3 = sorted.slice(0, 3).map((e, idx) => ({ ...e, rank: idx + 1 }))
  const first  = top3.find(e => e.rank === 1)
  const second = top3.find(e => e.rank === 2)
  const third  = top3.find(e => e.rank === 3)

  // Visual layout: 2nd | 1st | 3rd
  const visualOrder = [second, first, third].filter(Boolean)

  return (
    <section aria-label="Top 3 Podium">
      <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-5 items-end max-w-4xl mx-auto">
        <AnimatePresence mode="popLayout">
          {visualOrder.map((entry, idx) => (
            <PodiumCard
              key={`${viewMode}-${entry.id}`}
              entry={entry}
              delay={idx * 0.1}
              viewMode={viewMode}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  )
}
