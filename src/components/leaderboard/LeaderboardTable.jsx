import { useState, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AlertCircle, Trophy, Zap, ShieldCheck } from 'lucide-react'

function AnimatedScore({ value, className }) {
  const [displayValue, setDisplayValue] = useState(value || 0)

  useEffect(() => {
    let start = displayValue || 0
    let end = value || 0
    if (start === end) return

    let duration = 400
    let startTime = performance.now()

    const animate = (now) => {
      let elapsed = now - startTime
      let progress = Math.min(elapsed / duration, 1)
      let current = Math.round(start + (end - start) * progress)
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(end)
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  return (
    <span className={className} data-score style={{ fontVariantNumeric: 'tabular-nums' }}>
      {displayValue}
    </span>
  )
}

export default function LeaderboardTable({ entries = [], searchQuery = '', viewMode = 'overall' }) {
  const parentRef = useRef(null)

  const safeEntries = Array.isArray(entries) ? entries : []

  // Rank sorting based on viewMode & disqualification
  const sorted = [...safeEntries].sort((a, b) => {
    if (!a || !b) return 0
    if (a.disqualified && !b.disqualified) return 1
    if (!a.disqualified && b.disqualified) return -1
    const scoreA = viewMode === 'design' ? (a.design || 0) : (a.total || 0)
    const scoreB = viewMode === 'design' ? (b.design || 0) : (b.total || 0)
    return scoreB - scoreA
  }).map((entry, idx) => ({ ...entry, currentRank: entry?.disqualified ? 'DQ' : idx + 1 }))

  // Include ALL teams in official standings table (including top 3)
  const filtered = sorted.filter(e =>
    e &&
    (!searchQuery ||
      (e.name && e.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.code && e.code.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 58,
    overscan: 5,
  })

  return (
    <div className="w-full relative overflow-x-auto">
      {/* Table Header */}
      <div className="min-w-[340px] sm:min-w-full">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[#0B101D] border-b border-slate-800 text-[11px] font-semibold tracking-wider text-slate-400 uppercase sticky top-0 z-10 font-mono">
          <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
          <div className="col-span-6 sm:col-span-5">Team</div>
          {viewMode === 'overall' ? (
            <>
              <div className="col-span-1 text-right hidden sm:block">R1</div>
              <div className="col-span-1 text-right hidden sm:block">R2</div>
              <div className="col-span-1 text-right hidden sm:block">R3</div>
              <div className="col-span-1 text-right hidden sm:block text-cyan-400">DES</div>
              <div className="col-span-4 sm:col-span-2 text-right font-bold text-slate-200">Total</div>
            </>
          ) : (
            <div className="col-span-4 sm:col-span-6 text-right font-bold text-cyan-400">Design Mark (Max 25)</div>
          )}
        </div>

        {/* Scrollable Container */}
        <div
          ref={parentRef}
          className="overflow-y-auto max-h-[550px] min-h-[250px] divide-y divide-slate-800/50"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const entry = filtered[virtualItem.index]
              if (!entry) return null

              const isDQ = Boolean(entry.disqualified)
              const isTop1 = entry.currentRank === 1
              const isTop2 = entry.currentRank === 2
              const isTop3 = entry.currentRank === 3

              return (
                <div
                  key={`${viewMode}-${entry.id || virtualItem.index}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors text-sm ${
                    isDQ
                      ? 'bg-red-950/30 border-l-4 border-l-red-500 hover:bg-red-950/50'
                      : isTop1
                      ? 'bg-amber-500/10 border-l-4 border-l-amber-500 hover:bg-amber-500/15'
                      : isTop2
                      ? 'bg-cyan-500/10 border-l-4 border-l-cyan-400 hover:bg-cyan-500/15'
                      : isTop3
                      ? 'bg-indigo-500/10 border-l-4 border-l-indigo-400 hover:bg-indigo-500/15'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Rank */}
                  <div className={`col-span-2 sm:col-span-1 text-center font-bold font-mono flex items-center justify-center gap-1 ${
                    isDQ ? 'text-red-400' : isTop1 ? 'text-amber-400' : isTop2 ? 'text-cyan-400' : isTop3 ? 'text-indigo-300' : 'text-slate-400'
                  }`}>
                    {isTop1 && <Trophy size={13} className="text-amber-400 hidden sm:inline" />}
                    {isTop2 && <Zap size={13} className="text-cyan-400 hidden sm:inline" />}
                    {isTop3 && <ShieldCheck size={13} className="text-indigo-300 hidden sm:inline" />}
                    <span>{isDQ ? 'DQ' : `#${entry.currentRank}`}</span>
                  </div>

                  {/* Team Name & Code */}
                  <div className="col-span-6 sm:col-span-5 pr-2">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold truncate text-xs sm:text-sm ${isDQ ? 'text-red-200 line-through' : 'text-slate-100'}`}>
                        {entry.name || 'Unnamed Team'}
                      </p>
                      {isDQ && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-900/80 text-red-300 border border-red-500/50 flex items-center gap-1">
                          <AlertCircle size={10} /> DISQUALIFIED
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{entry.code || 'N/A'}</p>
                  </div>

                  {/* Breakdown / Scores */}
                  {isDQ ? (
                    <div className="col-span-4 sm:col-span-6 text-right font-mono font-bold text-red-400 text-xs sm:text-sm">
                      0 pts (DQ)
                    </div>
                  ) : viewMode === 'overall' ? (
                    <>
                      <div className="col-span-1 text-right text-slate-300 font-mono text-xs hidden sm:block">{entry.round_1 ?? 0}</div>
                      <div className="col-span-1 text-right text-slate-300 font-mono text-xs hidden sm:block">{entry.round_2 ?? 0}</div>
                      <div className="col-span-1 text-right text-slate-300 font-mono text-xs hidden sm:block">{entry.round_3 ?? 0}</div>
                      <div className="col-span-1 text-right text-cyan-400 font-mono text-xs hidden sm:block">{entry.design ?? 0}</div>
                      <div className="col-span-4 sm:col-span-2 text-right">
                        <AnimatedScore
                          value={entry.total || 0}
                          className="font-bold text-sm sm:text-base text-cyan-400"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-4 sm:col-span-6 text-right font-mono">
                      <AnimatedScore
                        value={entry.design || 0}
                        className="font-bold text-cyan-400 text-sm sm:text-base"
                      />
                      <span className="text-[10px] text-slate-500 ml-1">/ 25</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Empty Search Filter State */}
      {filtered.length === 0 && (
        <div className="py-12 text-center text-slate-500 text-sm font-mono">
          {searchQuery ? `No teams found matching "${searchQuery}"` : 'No teams currently registered in competition.'}
        </div>
      )}
    </div>
  )
}
