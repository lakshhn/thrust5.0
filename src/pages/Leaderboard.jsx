import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Rocket, Palette, Trophy, RefreshCw } from 'lucide-react'
import PodiumBlock from '../components/leaderboard/PodiumBlock.jsx'
import LeaderboardTable from '../components/leaderboard/LeaderboardTable.jsx'
import LiveStatusPill from '../components/ui/LiveStatusPill.jsx'
import SearchInput from '../components/ui/SearchInput.jsx'
import AerospaceBackground from '../components/ui/AerospaceBackground.jsx'
import AFCLogo from '../components/ui/AFCLogo.jsx'
import { computeLeaderboard } from '../data/mockData.js'
import { fetchGoogleSheetData } from '../lib/googleSheets.js'

// Poll interval — 15s is plenty for a live event without hammering Google
const POLL_INTERVAL_MS = 15_000

export default function Leaderboard() {
  const [entries, setEntries] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('overall')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Ref so syncAllData always has the latest value without re-creating the interval
  const isFetchingRef = useRef(false)
  const intervalRef = useRef(null)

  // ── Core sync function ──────────────────────────────────────
  const syncAllData = useCallback(async (showSpinner = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    if (showSpinner) setIsRefreshing(true)

    try {
      const sheetTeams = await fetchGoogleSheetData()

      if (sheetTeams && sheetTeams.length > 0) {
        // Sheet data is the source of truth — compute leaderboard directly.
        // Scores are already embedded in sheetTeams (round_1…design fields).
        const computed = computeLeaderboard(sheetTeams, [])
        setEntries(computed)
        setConnectionStatus('connected')
        setLastUpdated(new Date())
      } else {
        // Empty sheet — show empty state, not fake data
        setEntries([])
        setConnectionStatus('connected')
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.warn('[Leaderboard] Sync error:', err)
      setConnectionStatus(prev => prev === 'connected' ? 'stale' : 'reconnecting')
    } finally {
      isFetchingRef.current = false
      if (showSpinner) setIsRefreshing(false)
    }
  }, [])

  // ── Manual refresh button ───────────────────────────────────
  const handleManualRefresh = useCallback(() => {
    syncAllData(true)
  }, [syncAllData])

  // ── Polling + Visibility API ────────────────────────────────
  useEffect(() => {
    // Initial load
    syncAllData(true)

    // Start polling
    const startPolling = () => {
      if (intervalRef.current) return
      intervalRef.current = setInterval(() => {
        // Only poll when tab is visible — saves bandwidth for spectators
        if (!document.hidden) {
          syncAllData(false)
        }
      }, POLL_INTERVAL_MS)
    }

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    startPolling()

    // When tab becomes visible again after being hidden, sync immediately
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncAllData(false)
        startPolling()
      } else {
        // Optionally stop polling when hidden (saves resources)
        stopPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Re-sync when another tab's admin panel writes to localStorage
    const handleStorage = (e) => {
      if (e.key === 'thrust5_sheet_invalidate') {
        syncAllData(false)
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [syncAllData])

  return (
    <div className="min-h-screen relative bg-[#06090F] text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-cyan-400 selection:text-black">
      {/* Dynamic Aerospace Background */}
      <AerospaceBackground />

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col max-w-6xl w-full mx-auto px-3 sm:px-6">

        {/* ===== SITE HEADER ===== */}
        <header className="py-4 border-b border-slate-800/80 mb-6 flex flex-wrap items-center justify-between gap-4">

          {/* Brand Group */}
          <div className="flex items-center gap-3 sm:gap-4">
            <AFCLogo className="w-11 h-11 sm:w-14 sm:h-14" showText={false} />

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2.5">
                <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-wider text-white drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                  THRUST <span className="text-cyan-400">5.0</span>
                </h1>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 tracking-widest uppercase">
                  WATER ROCKET
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-mono font-semibold text-slate-400 tracking-[0.18em] uppercase mt-0.5">
                AERO FABRICATION CLUB <span className="text-cyan-400">·</span> IIITDMJ
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-[#0B101D] border border-slate-700/80 text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all text-xs font-mono flex items-center gap-1.5 disabled:opacity-50"
              title="Force Sync Google Sheet Data"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-cyan-400' : ''} />
              <span className="hidden sm:inline">Sync Sheet</span>
            </button>

            <LiveStatusPill status={connectionStatus} lastUpdated={lastUpdated} />

            <Link
              to="/admin/login"
              className="px-3 py-2 rounded-xl bg-[#0B101D] border border-slate-700/80 text-slate-300 hover:text-cyan-400 hover:border-cyan-400/50 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-md font-mono"
              title="Admin Panel Login"
            >
              <Lock size={13} className="text-cyan-400" />
              <span className="hidden sm:inline">Admin Portal</span>
            </Link>
          </div>
        </header>

        {/* ===== SEGMENTED SWITCHER ===== */}
        <div className="my-2 mb-6">
          <div className="segmented-toggle">
            <button
              onClick={() => setViewMode('overall')}
              className={`segmented-btn ${viewMode === 'overall' ? 'segmented-btn-active' : ''}`}
            >
              <Rocket size={16} />
              <span>Overall Rankings</span>
            </button>
            <button
              onClick={() => setViewMode('design')}
              className={`segmented-btn ${viewMode === 'design' ? 'segmented-btn-active' : ''}`}
            >
              <Palette size={16} />
              <span>Design Marks</span>
            </button>
          </div>
        </div>

        {/* ===== HERO PODIUM ===== */}
        {entries.length > 0 && (
          <div className="mb-6">
            <div className="text-center mb-3">
              <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-cyan-400">
                {viewMode === 'overall' ? '— Flight Leaderboard Champions —' : '— Highest Rated Aerodynamic Designs —'}
              </h2>
            </div>
            <PodiumBlock entries={entries} viewMode={viewMode} />
          </div>
        )}

        {/* ===== LEADERBOARD TABLE ===== */}
        <div className="card-cyber overflow-hidden mb-8">
          <div className="p-3 sm:p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0B101D]">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-heading">
                {viewMode === 'overall' ? 'Official Flight Standings' : 'Design Evaluation Scoreboard'}
              </h2>
            </div>

            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search team name or code..."
            />
          </div>

          <LeaderboardTable entries={entries} searchQuery={searchQuery} viewMode={viewMode} />
        </div>

        {/* Empty state */}
        {entries.length === 0 && connectionStatus === 'connected' && (
          <div className="text-center py-16 text-slate-500 font-mono text-sm">
            <p>No teams registered yet.</p>
            <p className="text-xs mt-1 text-slate-600">Results will appear here once the competition begins.</p>
          </div>
        )}

        {connectionStatus === 'connecting' && entries.length === 0 && (
          <div className="text-center py-16 text-slate-600 font-mono text-sm animate-pulse">
            <p>Loading live data from Google Sheets…</p>
          </div>
        )}

      </div>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 border-t border-slate-800/80 py-4 bg-[#06090F] text-center text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Aero Fabrication Club (AFC IIITDMJ). All Rights Reserved.</p>
          <p className="text-[11px] text-cyan-500/70">Thrust 5.0 Flagship Water Rocket Event</p>
        </div>
      </footer>
    </div>
  )
}
