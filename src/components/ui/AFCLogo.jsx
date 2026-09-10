export default function AFCLogo({ className = "w-11 h-11", showText = true }) {
  return (
    <div className="flex items-center gap-3">
      {/* Exact Official AFC Emblem Image (Background & Text removed, Cyan Glow filter added) */}
      <img
        src="/afc-emblem-clean.png"
        alt="Aero Fabrication Club Emblem"
        className={`object-contain filter drop-shadow-[0_0_12px_rgba(0,210,255,0.7)] hover:drop-shadow-[0_0_20px_rgba(0,210,255,1)] transition-all duration-300 ${className}`}
      />

      {/* Optional Side Typography */}
      {showText && (
        <div className="flex flex-col justify-center">
          <span className="font-heading font-extrabold text-base sm:text-lg tracking-wider text-white leading-tight">
            AERO FABRICATION CLUB
          </span>
          <span className="font-mono text-[11px] text-[#29ABE2] tracking-[0.25em] font-semibold">
            IIITDMJ
          </span>
        </div>
      )}
    </div>
  )
}
