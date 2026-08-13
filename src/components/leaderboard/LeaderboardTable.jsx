import { motion } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

function AnimatedScore({ value, className }) {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    let start = displayValue
    let end = value
    if (start === end) return

    let duration = 500
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

export default function LeaderboardTable({ entries, searchQuery = '', viewMode = 'overall' }) {
  const parentRef = useRef(null)

  // Rank sorting based on viewMode
  const sorted = [...entries].sort((a, b) => {
    return viewMode === 'design' ? (b.design - a.design) : (b.total - a.total)
  }).map((entry, idx) => ({ ...entry, currentRank: idx + 1 }))

  // Exclude top 3 (shown in podium) & filter search
  const filtered = sorted
    .filter(e => e.currentRank > 3)
    .filter(e =>
      !searchQuery ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.code.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[#0D131F]/90 border-b border-slate-800 text-[11px] font-semibold tracking-wider text-slate-400 uppercase sticky top-0 z-10 backdrop-blur-md">
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
              return (
                <div
                  key={`${viewMode}-${entry.id}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-cyan-500/5 transition-colors text-sm"
                >
                  {/* Rank */}
                  <div className="col-span-2 sm:col-span-1 text-center font-bold text-slate-400 font-mono">
                    #{entry.currentRank}
                  </div>

                  {/* Team Name & Code */}
                  <div className="col-span-6 sm:col-span-5 pr-2">
                    <p className="font-semibold text-slate-100 truncate text-xs sm:text-sm">{entry.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{entry.code}</p>
                  </div>

                  {/* Breakdown / Scores */}
                  {viewMode === 'overall' ? (
                    <>
                      <div className="col-span-1 text-right text-slate-400 text-xs hidden sm:block">{entry.round_1 ?? 0}</div>
                      <div className="col-span-1 text-right text-slate-400 text-xs hidden sm:block">{entry.round_2 ?? 0}</div>
                      <div className="col-span-1 text-right text-slate-400 text-xs hidden sm:block">{entry.round_3 ?? 0}</div>
                      <div className="col-span-1 text-right text-cyan-400 text-xs hidden sm:block">{entry.design ?? 0}</div>
                      <div className="col-span-4 sm:col-span-2 text-right">
                        <AnimatedScore
                          value={entry.total}
                          className="font-bold text-slate-100 text-sm sm:text-base text-cyan-400"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-4 sm:col-span-6 text-right">
                      <AnimatedScore
                        value={entry.design}
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
        <div className="py-12 text-center text-slate-500 text-sm">
          {searchQuery ? `No teams found for "${searchQuery}"` : 'No teams listed.'}
        </div>
      )}
    </div>
  )
}
