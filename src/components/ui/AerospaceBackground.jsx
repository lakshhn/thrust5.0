import { motion } from 'framer-motion'

export default function AerospaceBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Cyber Grid Matrix */}
      <div className="absolute inset-0 cyber-grid-bg opacity-70" />

      {/* 2. Radial Cyan Light Glows */}
      <div 
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[120px] opacity-25"
        style={{ background: 'radial-gradient(circle, rgba(41, 171, 226, 0.8) 0%, rgba(30, 111, 186, 0.4) 60%, transparent 100%)' }}
      />
      <div 
        className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full blur-[140px] opacity-15"
        style={{ background: 'radial-gradient(circle, rgba(0, 210, 255, 0.6) 0%, transparent 70%)' }}
      />

      {/* 3. Water Rocket Launch SVG Decoration (Right side floating) */}
      <motion.div 
        className="absolute top-24 right-4 md:right-16 opacity-30 md:opacity-50 hidden sm:block"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="80" height="130" viewBox="0 0 100 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Water Splash particles under rocket */}
          <circle cx="50" cy="140" r="4" fill="#29ABE2" opacity="0.6">
            <animate attributeName="cy" values="140;155;140" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="r" values="4;1;4" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="38" cy="135" r="3" fill="#00D2FF" opacity="0.5">
            <animate attributeName="cy" values="135;150;135" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="62" cy="135" r="3" fill="#29ABE2" opacity="0.5">
            <animate attributeName="cy" values="135;150;135" dur="1.1s" repeatCount="indefinite" />
          </circle>

          {/* Water pressure exhaust plume */}
          <path d="M42 120 Q50 155 58 120 Z" fill="url(#waterPlume)" opacity="0.7" />

          {/* Rocket Body */}
          <path d="M50 10 C62 40 68 70 65 115 L35 115 C32 70 38 40 50 10 Z" fill="#0D131F" stroke="#29ABE2" strokeWidth="2.5" />
          {/* Nosecone */}
          <path d="M50 10 C57 28 62 45 62 55 L38 55 C38 45 43 28 50 10 Z" fill="#29ABE2" opacity="0.8" />
          {/* Fins */}
          <path d="M35 85 L18 115 L35 110 Z" fill="#1E6FBA" stroke="#29ABE2" strokeWidth="1.5" />
          <path d="M65 85 L82 115 L65 110 Z" fill="#1E6FBA" stroke="#29ABE2" strokeWidth="1.5" />
          {/* AFC Logo badge on rocket body */}
          <circle cx="50" cy="75" r="7" fill="#1E6FBA" stroke="#29ABE2" strokeWidth="1" />
          <path d="M47 75 L53 75 M50 72 L50 78" stroke="#FFFFFF" strokeWidth="1.5" />

          <defs>
            <linearGradient id="waterPlume" x1="50" y1="120" x2="50" y2="155" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00D2FF" stopOpacity="0.8" />
              <stop offset="1" stopColor="#29ABE2" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* 4. Quadcopter Drone SVG Decoration (Left side hovering) */}
      <motion.div 
        className="absolute top-44 left-3 md:left-12 opacity-25 md:opacity-40 hidden sm:block"
        animate={{ y: [0, 10, 0], x: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="100" height="60" viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Frame Arms */}
          <line x1="30" y1="20" x2="90" y2="50" stroke="#29ABE2" strokeWidth="2.5" />
          <line x1="90" y1="20" x2="30" y2="50" stroke="#29ABE2" strokeWidth="2.5" />
          {/* Center Body */}
          <rect x="48" y="27" width="24" height="16" rx="4" fill="#0D131F" stroke="#00D2FF" strokeWidth="2" />
          <circle cx="60" cy="35" r="3" fill="#29ABE2" />

          {/* 4 Spinning Rotors */}
          <g>
            <ellipse cx="30" cy="20" rx="14" ry="3" stroke="#29ABE2" strokeWidth="1" opacity="0.6" className="animate-spin origin-[30px_20px]" />
            <ellipse cx="90" cy="20" rx="14" ry="3" stroke="#29ABE2" strokeWidth="1" opacity="0.6" className="animate-spin origin-[90px_20px]" />
            <ellipse cx="30" cy="50" rx="14" ry="3" stroke="#29ABE2" strokeWidth="1" opacity="0.6" className="animate-spin origin-[30px_50px]" />
            <ellipse cx="90" cy="50" rx="14" ry="3" stroke="#29ABE2" strokeWidth="1" opacity="0.6" className="animate-spin origin-[90px_50px]" />
          </g>

          {/* LED Scanner line */}
          <line x1="50" y1="41" x2="70" y2="41" stroke="#00D2FF" strokeWidth="1.5" />
        </svg>
      </motion.div>

      {/* 5. Glider Silhouette Crossing Sweep */}
      <div className="absolute top-12 left-0 right-0 h-10 animate-glider-sweep overflow-hidden">
        <svg width="45" height="20" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stealth Glider Wing */}
          <path d="M30 2 L58 20 L40 18 L30 22 L20 18 L2 20 Z" fill="#1E6FBA" stroke="#29ABE2" strokeWidth="1" />
        </svg>
      </div>

      {/* 6. Floating Hydro Particles */}
      <div className="absolute bottom-10 left-1/4 w-2 h-2 rounded-full bg-[#29ABE2] opacity-40 blur-[1px] animate-ping" />
      <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 rounded-full bg-[#00D2FF] opacity-50 blur-[1px] animate-pulse" />
    </div>
  )
}
