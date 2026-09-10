/**
 * Admin authentication for the Thrust 5.0 judging portal.
 *
 * Security model:
 * - The authenticated flag lives ONLY in this module's memory. It is never
 *   written to sessionStorage/localStorage, so every full page load (new tab,
 *   reload, bookmarked /admin URL) always requires logging in again.
 * - The password itself is never stored or compared in plaintext. Only a
 *   SHA-256 hex digest (VITE_ADMIN_PASSWORD_HASH in .env) ships in the bundle.
 * - crypto.subtle requires a secure context (https, or http://localhost for
 *   dev) — both are true for this app (Vercel hosting / local Vite dev).
 * - This is client-side auth for a static SPA: it stops casual access and
 *   keeps the plaintext password out of the bundle, but true server-verified
 *   auth (e.g. Supabase Auth + RLS) would be required for hardened security.
 */

const ADMIN_USERNAME = (import.meta.env.VITE_ADMIN_USERNAME || 'afc').trim().toLowerCase()
const ADMIN_PASSWORD_HASH = (import.meta.env.VITE_ADMIN_PASSWORD_HASH || '').trim().toLowerCase()

// Module-scoped, in-memory only. Resets on every full page load.
let authenticated = false

export function isAdminAuthenticated() {
  return authenticated
}

export function setAdminAuthenticated(value) {
  authenticated = !!value
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verify submitted credentials against the configured admin username and the
 * SHA-256 password hash. Returns a boolean — never throws on a mismatch.
 */
export async function verifyAdminCredentials(username, password) {
  if (!ADMIN_PASSWORD_HASH) {
    console.error('[adminAuth] VITE_ADMIN_PASSWORD_HASH is not configured — login disabled.')
    return false
  }

  const cleanUser = String(username || '').trim().toLowerCase()
  const cleanPass = String(password || '').trim()

  if (cleanUser !== ADMIN_USERNAME) return false

  const digest = await sha256Hex(cleanPass)

  // Length-safe, constant-time-ish comparison to avoid trivial timing leaks.
  if (digest.length !== ADMIN_PASSWORD_HASH.length) return false
  let diff = 0
  for (let i = 0; i < digest.length; i++) {
    diff |= digest.charCodeAt(i) ^ ADMIN_PASSWORD_HASH.charCodeAt(i)
  }
  return diff === 0
}