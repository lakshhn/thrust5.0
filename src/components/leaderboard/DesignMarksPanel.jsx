import { Palette, Award, ShieldCheck } from 'lucide-react'

export default function DesignMarksPanel({ entries }) {
  const ranked = [...entries]
    .sort((a, b) => b.design - a.design)
    .map((entry, idx) => ({ ...entry, designRank: idx + 1 }))

  return (
    <aside className="p-4 sm:p-5 card-cyber m-4" aria-label="Design Marks Breakdown">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
        <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <Palette size={18} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
            Design & Aerodynamics
          </h2>
          <p className="text-[11px] text-slate-400">
            Judged on CAD stability & structural integrity (Max 25 pts)
          </p>
        </div>
      </div>

      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {ranked.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-2.5 rounded-lg bg-[#070A0F]/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all text-xs"
          >
            <div className="flex items-center gap-3">
              <span className={`font-mono font-bold w-5 text-center ${
                entry.designRank === 1 ? 'text-yellow-400' :
                entry.designRank === 2 ? 'text-slate-300' :
                entry.designRank === 3 ? 'text-amber-600' : 'text-slate-500'
              }`}>
                #{entry.designRank}
              </span>
              <div>
                <p className="font-semibold text-slate-200">{entry.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">{entry.code}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-bold text-cyan-400 text-sm">{entry.design}</span>
              <span className="text-[10px] text-slate-500"> / 25</span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
