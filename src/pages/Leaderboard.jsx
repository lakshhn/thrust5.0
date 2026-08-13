import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import PodiumBlock from '../components/leaderboard/PodiumBlock.jsx'
import LeaderboardTable from '../components/leaderboard/LeaderboardTable.jsx'
import DesignMarksPanel from '../components/leaderboard/DesignMarksPanel.jsx'
import LiveStatusPill from '../components/ui/LiveStatusPill.jsx'
import SearchInput from '../components/ui/SearchInput.jsx'
import { MOCK_LEADERBOARD } from '../data/mockData.js'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { computeLeaderboard } from '../data/mockData.js'

const HEARTBEAT_TIMEOUT_MS = 45000 // 45 seconds before "reconnecting" state

export default function Leaderboard() {
  const [entries, setEntries] = useState(MOCK_LEADERBOARD)
  const [connectionStatus, setConnectionStatus] = useState(
    isSupabaseConfigured ? 'connected' : 'stale'
  )
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('leaderboard') // mobile: 'leaderboard' | 'design'

  const heartbeatTimer = useRef(null)
  const subscriptionRef = useRef(null)

  // Set up Supabase Realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const resetHeartbeat = () => {
      clearTimeout(heartbeatTimer.current)
      setConnectionStatus('connected')
      heartbeatTimer.current = setTimeout(() => {
        setConnectionStatus('reconnecting')
        startSheetFallback()
      }, HEARTBEAT_TIMEOUT_MS)
    }

    const fetchLeaderboard = async () => {
      try {
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('created_at')

        const { data: scores, error: scoresError } = await supabase
          .from('scores')
          .select('team_id, category, value')

        if (teamsError || scoresError) throw new Error('Failed to fetch data')

        // Transform Supabase scores into per-team score objects
        const scoresByTeam = {}
        scores.forEach(s => {
          if (!scoresByTeam[s.team_id]) scoresByTeam[s.team_id] = {}
          scoresByTeam[s.team_id][s.category] = s.value
        })

        const scoreMapped = teams.map(t => ({
          team_id: t.id,
          round_1: scoresByTeam[t.id]?.round_1 || 0,
          round_2: scoresByTeam[t.id]?.round_2 || 0,
          round_3: scoresByTeam[t.id]?.round_3 || 0,
          design: scoresByTeam[t.id]?.design || 0,
        }))

        const leaderboard = computeLeaderboard(teams, scoreMapped)
        setEntries(leaderboard)
        setLastUpdated(new Date())
        resetHeartbeat()
      } catch (err) {
        console.error('[Leaderboard] Failed to fetch:', err)
      }
    }

    fetchLeaderboard()

    // Subscribe to real-time score changes
    const channel = supabase
      .channel('public-scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
        fetchLeaderboard()
        resetHeartbeat()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchLeaderboard()
        resetHeartbeat()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected')
          resetHeartbeat()
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('reconnecting')
        }
      })

    subscriptionRef.current = channel

    return () => {
      clearTimeout(heartbeatTimer.current)
      supabase.removeChannel(channel)
    }
  }, [])

  // Google Sheets fallback polling
  const startSheetFallback = () => {
    const sheetUrl = import.meta.env.VITE_SHEETS_CSV_URL
    if (!sheetUrl) return

    const pollSheet = async () => {
      try {
        const res = await fetch(sheetUrl)
        const text = await res.text()
        // Parse CSV fallback — format: Team,Round1,Round2,Round3,Design
        // Simple CSV parse (no library needed for this structure)
        const lines = text.trim().split('\n').slice(1) // skip header
        const sheetEntries = lines.map((line, idx) => {
          const [name, r1, r2, r3, design] = line.split(',')
          const round_1 = parseInt(r1) || 0
          const round_2 = parseInt(r2) || 0
          const round_3 = parseInt(r3) || 0
          const des = parseInt(design) || 0
          const total = round_1 + round_2 + round_3 + des
          return {
            id: `sheet-${idx}`,
            name: name?.trim() || `Team ${idx + 1}`,
            code: `T-${String(idx + 1).padStart(2, '0')}`,
            round_1, round_2, round_3,
            design: des,
            total,
            rank: idx + 1, // will re-sort below
          }
        })
        .sort((a, b) => b.total - a.total)
        .map((e, i) => ({ ...e, rank: i + 1 }))

        setEntries(sheetEntries)
        setLastUpdated(new Date())
        setConnectionStatus('stale') // degraded but working
      } catch (err) {
        console.error('[Leaderboard] Sheet fallback failed:', err)
      }
    }

    pollSheet()
    const interval = setInterval(pollSheet, 12000) // poll every 12s in fallback mode
    return () => clearInterval(interval)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* ===== SITE HEADER ===== */}
      <header
        className="site-header"
        role="banner"
      >
        <div className="flex items-center justify-between px-4 md:px-6 h-16">
          {/* Brand / Wordmark */}
          <div>
            <h1
              className="display-text text-2xl md:text-3xl tracking-widest leading-none"
              style={{ color: 'var(--text-primary)' }}
            >
              THRUST 5.0
            </h1>
            <p
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: 'var(--text-faint)', letterSpacing: '0.18em' }}
            >
              Aero Fabrication Club
            </p>
          </div>

          {/* Right: live status + admin link */}
          <div className="flex items-center gap-4">
            <LiveStatusPill status={connectionStatus} lastUpdated={lastUpdated} />
            <Link
              to="/admin/login"
              className="hidden md:flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-md transition-colors"
              style={{
                color: 'var(--text-faint)',
                border: '1px solid var(--border-subtle)',
              }}
              aria-label="Admin panel login"
            >
              <Lock size={11} strokeWidth={2} aria-hidden="true" />
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* ===== MOBILE TAB BAR ===== */}
      <nav
        className="tab-bar-mobile"
        role="tablist"
        aria-label="Leaderboard sections"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'leaderboard'}
          className={`round-tab ${activeTab === 'leaderboard' ? 'round-tab-active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
          id="tab-leaderboard"
          aria-controls="panel-leaderboard"
        >
          Rankings
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'design'}
          className={`round-tab ${activeTab === 'design' ? 'round-tab-active' : ''}`}
          onClick={() => setActiveTab('design')}
          id="tab-design"
          aria-controls="panel-design"
        >
          Design Marks
        </button>
      </nav>

      {/* ===== MAIN CONTENT GRID ===== */}
      <main>
        <div className="leaderboard-layout">
          {/* === LEFT: MAIN LEADERBOARD === */}
          <div
            className={`main-leaderboard-area ${activeTab !== 'leaderboard' ? 'hidden lg:block' : ''}`}
            id="panel-leaderboard"
            role="tabpanel"
            aria-labelledby="tab-leaderboard"
          >
            {/* Podium block */}
            <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <PodiumBlock entries={entries} />
            </div>

            {/* Search + table header */}
            <div
              className="flex items-center justify-between px-4 md:px-6 py-3"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <h2
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-faint)' }}
              >
                Full Rankings
              </h2>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search teams…"
              />
            </div>

            {/* Leaderboard table */}
            <LeaderboardTable entries={entries} searchQuery={searchQuery} />
          </div>

          {/* === RIGHT: DESIGN MARKS PANEL === */}
          <div
            className={`design-marks-panel ${activeTab === 'design' ? 'tab-active' : ''}`}
            id="panel-design"
            role="tabpanel"
            aria-labelledby="tab-design"
          >
            <DesignMarksPanel entries={entries} />
          </div>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer
        className="px-4 md:px-6 py-4"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
        role="contentinfo"
      >
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
          Thrust 5.0 · Aero Fabrication Club · Live scoring system
        </p>
      </footer>
    </div>
  )
}
