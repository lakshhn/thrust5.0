import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, AlertCircle, Loader2, Lock, User as UserIcon } from 'lucide-react'
import AFCLogo from '../components/ui/AFCLogo.jsx'
import { isAdminAuthenticated, setAdminAuthenticated, verifyAdminCredentials } from '../lib/adminAuth.js'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 60 * 1000 // 1 minute lockout

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(null)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)

  // In-memory auth check only — the flag is never persisted, so any fresh
  // page load (reload / new tab) always requires logging in again.
  useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate('/admin', { replace: true })
    }
  }, [navigate])

  // Lockout countdown timer
  useEffect(() => {
    if (!lockedUntil) return
    const timer = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000)
      if (remaining <= 0) {
        setLockedUntil(null)
        setLockoutRemaining(0)
        setAttempts(0)
        setError('')
        clearInterval(timer)
      } else {
        setLockoutRemaining(remaining)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [lockedUntil])

  const isLocked = lockedUntil && Date.now() < lockedUntil

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 620)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isLocked) return

    setIsLoading(true)
    setError('')

    const verify = async () => {
      const cleanUser = username.trim().toLowerCase()
      const cleanPass = password.trim()

      // SHA-256 digest comparison against VITE_ADMIN_PASSWORD_HASH —
      // no plaintext password exists anywhere in the bundle.
      const isValid = await verifyAdminCredentials(cleanUser, cleanPass)

      if (isValid) {
        // In-memory only — cleared on any full page load.
        setAdminAuthenticated(true)
        setIsLoading(false)
        navigate('/admin', { replace: true })
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        if (newAttempts >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_MS
          setLockedUntil(until)
          setError(`Too many failed attempts. Locked out for ${LOCKOUT_MS / 1000}s.`)
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts
          setError(`Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`)
        }
        setIsLoading(false)
        triggerShake()
      }
    }

    verify()
  }

  return (
    <div className="min-h-screen relative bg-[#06090F] text-slate-100 flex items-center justify-center p-4 selection:bg-cyan-400 selection:text-black">
      {/* Background Cyber Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 240, 255, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 240, 255, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <AFCLogo className="w-16 h-16" showText={false} />
          </div>
          <h1 className="font-heading font-black text-2xl tracking-widest text-white drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]">
            THRUST <span className="text-cyan-400">5.0</span>
          </h1>
          <p className="text-[10px] font-mono font-bold text-slate-400 tracking-[0.25em] uppercase mt-1">
            AERO FABRICATION CLUB · IIITDMJ
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono font-semibold">
            <Lock size={12} /> RESTRICTED JUDGING PORTAL
          </div>
        </div>

        {/* Login Form Card */}
        <motion.div className={shake ? 'animate-shake' : ''}>
          <form
            onSubmit={handleSubmit}
            className="p-6 rounded-2xl bg-[#0B101D] border border-slate-700/80 shadow-2xl space-y-4"
            noValidate
          >
            {/* Username */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-mono font-semibold text-slate-400 mb-1.5 uppercase"
              >
                Username
              </label>
              <div className="relative">
                <UserIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/70" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="afc"
                  required
                  autoComplete="username"
                  disabled={isLocked || isLoading}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#06090F] border border-slate-700 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-mono font-semibold text-slate-400 mb-1.5 uppercase"
              >
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/70" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={isLocked || isLoading}
                  className="w-full pl-9 pr-10 py-2.5 bg-[#06090F] border border-slate-700 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all"
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 text-xs font-mono rounded-xl p-3 bg-red-950/40 border border-red-500/40 text-red-300"
                >
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLocked || isLoading || !username || !password}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Authenticating…
                </>
              ) : isLocked ? (
                `Locked (${lockoutRemaining}s)`
              ) : (
                'Log In to Portal'
              )}
            </button>
          </form>
        </motion.div>

        {/* Back Link */}
        <p className="text-center mt-6 text-xs font-mono">
          <Link to="/" className="text-slate-400 hover:text-cyan-400 transition-colors">
            ← Back to Public Leaderboard
          </Link>
        </p>
      </div>
    </div>
  )
}
