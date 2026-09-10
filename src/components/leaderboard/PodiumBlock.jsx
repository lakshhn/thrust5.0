import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Zap, ShieldCheck } from 'lucide-react'

const RANK_CONFIG = {
  1: {
    accent: '#FF9F1C',
    glowColor: 'rgba(255, 159, 28, 0.35)',
    borderClass: 'border-amber-500/50 bg-[#0F1626]',
    textGradient: 'from-amber-300 via-orange-400 to-amber-500',
    height: 'h-64 sm:h-72 md:h-80',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    icon: Trophy
  },
  2: {
    accent: '#00F0FF',
    glowColor: 'rgba(0, 240, 255, 0.25)',
    borderClass: 'border-cyan-500/40 bg-[#0B101D]',
    textGradient: 'from-white via-cyan-200 to-cyan-400',
    height: 'h-56 sm:h-64 md:h-72',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    icon: Zap
  },
  3: {
    accent: '#A5B4FC',
    glowColor: 'rgba(165, 180, 252, 0.25)',
    borderClass: 'border-indigo-500/40 bg-[#0C0F1D]',
    textGradient: 'from-indigo-200 via-indigo-300 to-indigo-400',
    height: 'h-48 sm:h-56 md:h-64',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
    icon: ShieldCheck
  },
}

function PodiumCard({ entry, rank, viewMode }) {
  if (!entry) return null

  const config = RANK_CONFIG[rank] || RANK_CONFIG[3]
  const displayScore = viewMode === 'design' ? (entry.design || 0) : (entry.total || 0)
  const rankLabel = rank === 1 ? '1ST' : rank === 2 ? '2ND' : '3RD'
  const IconComp = config.icon

  return (
    <motion.div
      key={`podium-card-${rank}-${entry.id || rank}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`relative flex flex-col justify-between ${config.height} p-3.5 sm:p-5 rounded-2xl border ${config.borderClass} shadow-xl overflow-hidden group w-full`}
      style={{
        boxShadow: `0 8px 30px -5px ${config.glowColor}`
      }}
      role="article"
      aria-label={`Rank ${rank}: ${entry.name || 'Team'}`}
    >
      {/* Top Header Badge */}
      <div className="flex items-center justify-between z-10">
        <span className={`text-xl sm:text-3xl font-extrabold font-heading tracking-tight flex items-center gap-1.5 text-transparent bg-clip-text bg-gradient-to-r ${config.textGradient}`}>
          <IconComp size={18} style={{ color: config.accent }} />
          {rankLabel}
        </span>
        <span className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full border ${config.badgeBg}`}>
          {entry.code || 'T-00'}
        </span>
      </div>

      {/* Team Name */}
      <div className="my-auto py-1 z-10">
        <h2 className="font-bold text-slate-100 text-sm sm:text-base md:text-lg leading-tight line-clamp-2">
          {entry.name || 'Team'}
        </h2>
      </div>

      {/* Score Section */}
      <div className="z-10">
        <div className="flex items-baseline gap-1 mb-2">
          <span
            className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight"
            style={{ color: config.accent }}
          >
            {displayScore}
          </span>
          <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
            {viewMode === 'design' ? 'pts (Design)' : 'pts total'}
          </span>
        </div>

        {/* Per-Round Mini Matrix */}
        {viewMode === 'overall' && (
          <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-800/80 font-mono">
            <div className="text-center">
              <p className="text-[11px] font-bold text-slate-200">{entry.round_1 ?? 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">R1</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold text-slate-200">{entry.round_2 ?? 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">R2</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold text-slate-200">{entry.round_3 ?? 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">R3</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold text-cyan-400">{entry.design ?? 0}</p>
              <p className="text-[9px] text-slate-500 uppercase">DES</p>
            </div>
          </div>
        )}
      </div>

      {/* Background Watermark Rank Number */}
      <div
        className="absolute -right-2 -bottom-4 text-7xl sm:text-8xl select-none pointer-events-none opacity-[0.04] font-black font-heading"
        style={{ color: config.accent }}
        aria-hidden="true"
      >
        {rank}
      </div>
    </motion.div>
  )
}

export default function PodiumBlock({ entries = [], viewMode = 'overall' }) {
  if (!entries || !Array.isArray(entries) || entries.length === 0) return null

  // Filter out disqualified teams from top 3 podium
  const eligible = entries.filter(e => e && !e.disqualified)

  const sorted = [...eligible].sort((a, b) => {
    const scoreA = viewMode === 'design' ? (a.design || 0) : (a.total || 0)
    const scoreB = viewMode === 'design' ? (b.design || 0) : (b.total || 0)
    return scoreB - scoreA
  })

  const first  = sorted[0] ? { ...sorted[0], rank: 1 } : null
  const second = sorted[1] ? { ...sorted[1], rank: 2 } : null
  const third  = sorted[2] ? { ...sorted[2], rank: 3 } : null

  // Visual layout order: 2nd | 1st | 3rd
  const visualOrder = [
    { item: second, rank: 2 },
    { item: first,  rank: 1 },
    { item: third,  rank: 3 }
  ].filter(x => x.item !== null)

  if (visualOrder.length === 0) return null

  const gridColsClass = visualOrder.length === 1 ? 'grid-cols-1 max-w-sm' : visualOrder.length === 2 ? 'grid-cols-2 max-w-2xl' : 'grid-cols-3 max-w-4xl'

  return (
    <section aria-label="Top 3 Podium">
      <div className={`grid ${gridColsClass} gap-2 sm:gap-4 p-2 sm:p-4 items-end mx-auto min-h-[280px]`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            className="contents"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {visualOrder.map(({ item, rank }) => (
              <PodiumCard
                key={`podium-${viewMode}-${item.id || rank}`}
                entry={item}
                rank={rank}
                viewMode={viewMode}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
