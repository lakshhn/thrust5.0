import { motion } from 'framer-motion'

export default function AerospaceBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Cyber Grid Mesh Background */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(41, 171, 226, 0.3) 0%, transparent 70%),
            linear-gradient(to right, rgba(41, 171, 226, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(41, 171, 226, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 45px 45px, 45px 45px',
        }}
      />

      {/* 2. Top-Right Rotating Tactical Radar Sweep */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-28 h-28 sm:w-36 sm:h-36 opacity-30">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="48" stroke="#29ABE2" strokeWidth="1" strokeDasharray="4 2" fill="none" />
          <circle cx="50" cy="50" r="34" stroke="#29ABE2" strokeWidth="0.8" fill="none" />
          <circle cx="50" cy="50" r="20" stroke="#29ABE2" strokeWidth="0.5" strokeDasharray="2 2" fill="none" />
          <line x1="50" y1="2" x2="50" y2="98" stroke="#29ABE2" strokeWidth="0.5" />
          <line x1="2" y1="50" x2="98" y2="50" stroke="#29ABE2" strokeWidth="0.5" />
          
          {/* Radar Sweep Arc Beam */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '50px 50px' }}
          >
            <path d="M50 50 L50 2 A48 48 0 0 1 98 50 Z" fill="url(#radarSweep)" />
          </motion.g>
          <defs>
            <radialGradient id="radarSweep" cx="50" cy="50" r="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00D2FF" stopOpacity="0.4" />
              <stop offset="1" stopColor="#00D2FF" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* 3. Water Rocket Launch Animation (Left Side) */}
      <motion.div
        className="absolute bottom-0 left-4 sm:left-16 w-20 sm:w-28 opacity-80"
        initial={{ y: 0, opacity: 0 }}
        animate={{
          y: [-20, -750, -750],
          x: [0, 90, 140],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 8.5,
          repeat: Infinity,
          repeatDelay: 4,
          ease: 'easeInOut',
        }}
      >
        <svg viewBox="0 0 100 200" fill="none" className="w-full h-auto filter drop-shadow-[0_0_15px_#00D2FF]">
          {/* Exhaust Water Steam Plume */}
          <path d="M45 140 Q 50 195 55 140" stroke="#00D2FF" strokeWidth="10" strokeLinecap="round" opacity="0.8" />
          <path d="M48 150 Q 50 205 52 150" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.95" />
          {/* Bottle Rocket Fuselage */}
          <path d="M50 10 C 68 30 68 110 68 130 L 32 130 C 32 110 32 30 50 10 Z" fill="#1E6FBA" stroke="#00D2FF" strokeWidth="3" />
          {/* Nose Cone */}
          <path d="M50 10 C 58 24 58 40 50 45 C 42 40 42 24 50 10 Z" fill="#00D2FF" />
          {/* Fins */}
          <path d="M32 100 L 10 135 L 32 130 Z" fill="#29ABE2" />
          <path d="M68 100 L 90 135 L 68 130 Z" fill="#29ABE2" />
        </svg>
      </motion.div>

      {/* 4. Hovering Quadcopter Drone (Right Top) */}
      <motion.div
        className="absolute top-24 right-12 sm:right-28 w-24 sm:w-32 opacity-75"
        animate={{
          y: [0, 18, -12, 0],
          x: [0, -18, 12, 0],
          rotate: [-3, 4, -2, -3],
        }}
        transition={{
          duration: 6.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg viewBox="0 0 120 120" fill="none" className="w-full h-auto filter drop-shadow-[0_0_12px_#29ABE2]">
          {/* Rotors spinning */}
          <circle cx="25" cy="25" r="15" stroke="#29ABE2" strokeWidth="2.5" strokeDasharray="6 4" className="animate-spin" />
          <circle cx="95" cy="25" r="15" stroke="#29ABE2" strokeWidth="2.5" strokeDasharray="6 4" className="animate-spin" />
          <circle cx="25" cy="95" r="15" stroke="#29ABE2" strokeWidth="2.5" strokeDasharray="6 4" className="animate-spin" />
          <circle cx="95" cy="95" r="15" stroke="#29ABE2" strokeWidth="2.5" strokeDasharray="6 4" className="animate-spin" />
          {/* Carbon Fiber Arm Struts */}
          <line x1="25" y1="25" x2="95" y2="95" stroke="#1E6FBA" strokeWidth="5" />
          <line x1="95" y1="25" x2="25" y2="95" stroke="#1E6FBA" strokeWidth="5" />
          {/* Flight Computer Core */}
          <circle cx="60" cy="60" r="18" fill="#0D131F" stroke="#00D2FF" strokeWidth="3" />
          <circle cx="60" cy="60" r="6" fill="#00D2FF" className="animate-ping" />
          {/* Scanning Cone Beam */}
          <polygon points="60,60 25,120 95,120" fill="url(#droneScanner)" opacity="0.4" />
          <defs>
            <linearGradient id="droneScanner" x1="60" y1="60" x2="60" y2="120" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00D2FF" />
              <stop offset="1" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* 5. Glider Aircraft Traversing Background */}
      <motion.div
        className="absolute top-1/2 left-0 w-36 sm:w-52 opacity-40"
        initial={{ x: '-100%', y: 0 }}
        animate={{
          x: ['-20%', '120vw'],
          y: [0, 90, -50, 30],
          rotate: [6, 2, -5, 3],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          repeatDelay: 6,
          ease: 'linear',
        }}
      >
        <svg viewBox="0 0 200 80" fill="none" className="w-full h-auto">
          <path d="M10 40 L 100 8 L 190 40 L 100 30 Z" fill="#29ABE2" opacity="0.85" />
          <path d="M100 8 L 100 72 L 96 78 L 100 30 Z" fill="#00D2FF" />
          <path d="M78 70 L 122 70 L 100 62 Z" fill="#1E6FBA" />
        </svg>
      </motion.div>

      {/* 6. Live Telemetry HUD Widget (Bottom Right) */}
      <div className="absolute bottom-6 right-6 hidden md:flex flex-col items-end opacity-60 font-mono text-[10px] text-[#29ABE2] bg-[#070A0F]/80 p-3 rounded-lg border border-[#29ABE2]/30 backdrop-blur-sm space-y-1 shadow-lg">
        <div className="flex items-center gap-2 border-b border-[#29ABE2]/40 pb-1.5 w-full justify-between">
          <span className="font-bold tracking-widest text-white">APOGEE TELEMETRY</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="w-full flex justify-between gap-4"><span>ALTITUDE:</span> <span className="text-white font-bold">142.8 m</span></div>
        <div className="w-full flex justify-between gap-4"><span>PRESSURE:</span> <span className="text-white font-bold">6.5 BAR</span></div>
        <div className="w-full flex justify-between gap-4"><span>STATUS:</span> <span className="text-emerald-400 font-bold">LIVE SYNC</span></div>
      </div>
    </div>
  )
}
