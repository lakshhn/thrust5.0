import { motion } from 'framer-motion'
import { Radio, AlertOctagon, Clock, ShieldCheck, ArrowRight } from 'lucide-react'
import AFCLogo from '../components/ui/AFCLogo.jsx'
import AerospaceBackground from '../components/ui/AerospaceBackground.jsx'

export default function OfflineStandby() {
  return (
    <div className="min-h-screen relative bg-[#06090F] text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-cyan-400 selection:text-black font-sans">
      {/* Dynamic Aerospace Radar & Drone Background */}
      <AerospaceBackground />

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4">
            <AFCLogo className="w-16 h-16 sm:w-20 sm:h-20" showText={false} />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="font-heading font-black text-2xl sm:text-4xl tracking-wider text-white drop-shadow-[0_0_16px_rgba(0,240,255,0.4)]">
              THRUST <span className="text-cyan-400">5.0</span>
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 tracking-widest uppercase">
              WATER ROCKET
            </span>
          </div>

          <p className="text-xs sm:text-sm font-mono font-semibold text-slate-400 tracking-[0.2em] uppercase">
            AERO FABRICATION CLUB <span className="text-cyan-400">·</span> IIITDM JABALPUR
          </p>
        </div>

        {/* Central Standby Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full bg-[#0B101D]/90 border border-slate-800/90 rounded-2xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden text-center space-y-6"
        >
          {/* Top Subtle Amber/Cyan Accent Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" />

          {/* Operational Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <Radio size={13} className="text-amber-400" />
            <span>PORTAL OFFLINE · STANDBY</span>
          </div>

          {/* Headline & Description */}
          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="font-heading font-black text-xl sm:text-3xl text-white tracking-wide">
              Leaderboard Temporarily Shutdown
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
              The live leaderboard and flight scoring portal are currently offline for official round evaluation, score tallying, and technical maintenance.
            </p>
            <p className="text-xs sm:text-sm text-cyan-400/90 font-mono">
              Live standings will be reactivated shortly. Please check back soon!
            </p>
          </div>

          {/* Telemetry Indicator Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 max-w-lg mx-auto font-mono text-left">
            <div className="p-3 rounded-lg bg-[#06090F]/70 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Event</span>
              <span className="text-xs font-bold text-slate-200">Thrust 5.0</span>
            </div>
            <div className="p-3 rounded-lg bg-[#06090F]/70 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Mode</span>
              <span className="text-xs font-bold text-amber-400">Evaluation</span>
            </div>
            <div className="p-3 rounded-lg bg-[#06090F]/70 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">System Status</span>
              <span className="text-xs font-bold text-cyan-400">Paused</span>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="pt-2 text-[11px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} className="text-cyan-400" />
            <span>Scores & data are securely recorded in the official registry.</span>
          </div>
        </motion.div>

      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-4 bg-[#06090F] text-center text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Aero Fabrication Club (AFC IIITDMJ). All Rights Reserved.</p>
          <p className="text-[11px] text-cyan-500/70">Thrust 5.0 Flagship Water Rocket Event</p>
        </div>
      </footer>
    </div>
  )
}
