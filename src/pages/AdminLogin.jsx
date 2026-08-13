import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 60 * 1000 // 1 minute

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(null)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)

  // Check if already logged in
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/admin')
    })
  }, [navigate])

  // Lockout countdown
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isLocked) return

    if (!supabase) {
      // Dev mode: bypass auth
      if (email === 'admin@thrust5.in' && password === 'admin') {
        navigate('/admin')
        return
      }
      setError('Invalid credentials')
      triggerShake()
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        if (newAttempts >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_MS
          setLockedUntil(until)
          setError(`Too many failed attempts. Try again in ${LOCKOUT_MS / 1000}s.`)
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts
          setError(`Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`)
        }
        triggerShake()
        return
      }

      // Success — navigate to admin panel
      navigate('/admin')
    } catch (err) {
      setError('Login failed. Please check your connection and try again.')
      triggerShake()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Background texture — subtle grid pattern, no gradient blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="display-text text-4xl tracking-widest mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            THRUST 5.0
          </h1>
          <p
            className="text-xs uppercase tracking-[0.2em] mb-6"
            style={{ color: 'var(--text-faint)' }}
          >
            Aero Fabrication Club
          </p>
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            Admin access only
          </p>
        </div>

        {/* Login form */}
        <motion.div
          className={shake ? 'animate-shake' : ''}
        >
          <form
            className="card p-6 space-y-4"
            onSubmit={handleSubmit}
            aria-label="Admin login form"
            noValidate
          >
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                className={`input ${error ? 'input-error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="judge@aerofab.in"
                required
                autoComplete="email"
                disabled={isLocked || isLoading}
                aria-describedby={error ? 'login-error' : undefined}
                aria-invalid={!!error}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-10 ${error ? 'input-error' : ''}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={isLocked || isLoading}
                  aria-describedby={error ? 'login-error' : undefined}
                  aria-invalid={!!error}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-faint)' }}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword
                    ? <EyeOff size={16} strokeWidth={1.5} />
                    : <Eye size={16} strokeWidth={1.5} />
                  }
                </button>
              </div>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  id="login-error"
                  role="alert"
                  aria-live="assertive"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 text-sm rounded-md px-3 py-2.5"
                  style={{
                    backgroundColor: 'rgba(229,72,77,0.1)',
                    border: '1px solid rgba(229,72,77,0.25)',
                    color: 'var(--danger)',
                  }}
                >
                  <AlertCircle size={14} strokeWidth={2} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>
                    {isLocked
                      ? `Account locked. Try again in ${lockoutRemaining}s.`
                      : error
                    }
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              id="admin-login-submit"
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              disabled={isLocked || isLoading || !email || !password}
              aria-disabled={isLocked || isLoading}
            >
              {isLoading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {isLocked
                ? `Locked (${lockoutRemaining}s)`
                : isLoading
                ? 'Signing in…'
                : 'Sign in'
              }
            </button>
          </form>
        </motion.div>

        {/* Back to leaderboard */}
        <p className="text-center mt-6 text-xs" style={{ color: 'var(--text-faint)' }}>
          <a href="/" style={{ color: 'var(--thrust-blue)' }} className="hover:underline">
            ← Back to leaderboard
          </a>
        </p>
      </div>
    </div>
  )
}
