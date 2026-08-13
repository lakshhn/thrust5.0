import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Lock, Rocket, Palette, Trophy, RefreshCw } from 'lucide-react'
import PodiumBlock from '../components/leaderboard/PodiumBlock.jsx'
import LeaderboardTable from '../components/leaderboard/LeaderboardTable.jsx'
import DesignMarksPanel from '../components/leaderboard/DesignMarksPanel.jsx'
import LiveStatusPill from '../components/ui/LiveStatusPill.jsx'
import SearchInput from '../components/ui/SearchInput.jsx'
import AerospaceBackground from '../components/ui/AerospaceBackground.jsx'
import { MOCK_LEADERBOARD, computeLeaderboard } from '../data/mockData.js'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const HEARTBEAT_TIMEOUT_MS = 45000

export default function Leaderboard() {
  const [entries, setEntries] = useState(MOCK_LEADERBOARD)
  const [connectionStatus, setConnectionStatus] = useState(
    isSupabaseConfigured ? 'connected' : 'stale'
  )
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  // View mode switcher: 'overall' | 'design'
  const [viewMode, setViewMode] = useState('overall')

  const heartbeatTimer = useRef(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const resetHeartbeat = () => {
      clearTimeout(heartbeatTimer.current)
      setConnectionStatus('connected')
      heartbeatTimer.current = setTimeout(() => {
        setConnectionStatus('reconnecting')
      }, HEARTBEAT_TIMEOUT_MS)
    }

    const fetchLeaderboard = async () => {
      try {
        const { data: teams, error: tErr } = await supabase.from('teams').select('*').order('created_at')
        const { data: scores, error: sErr } = await supabase.from('scores').select('team_id, category, value')

        if (tErr || sErr) throw new Error('Data fetch failed')

        const scoreMap = {}
        scores.forEach(s => {
          if (!scoreMap[s.team_id]) scoreMap[s.team_id] = {}
          scoreMap[s.team_id][s.category] = s.value
        })

        const mappedScores = teams.map(t => ({
          team_id: t.id,
          round_1: scoreMap[t.id]?.round_1 || 0,
          round_2: scoreMap[t.id]?.round_2 || 0,
          round_3: scoreMap[t.id]?.round_3 || 0,
          design: scoreMap[t.id]?.design || 0,
        }))

        const leaderboard = computeLeaderboard(teams, mappedScores)
        setEntries(leaderboard)
        setLastUpdated(new Date())
        resetHeartbeat()
      } catch (err) {
        console.error('[Leaderboard] Sync Error:', err)
      }
    }

    fetchLeaderboard()

    const channel = supabase
      .channel('public-scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
        fetchLeaderboard()
      })
      .subscribe()

    return () => {
      clearTimeout(heartbeatTimer.current)
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="min-h-screen relative bg-[#070A0F] text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* Dynamic Aerospace Background Decorations */}
      <AerospaceBackground />

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col max-w-6xl w-full mx-auto px-3 sm:px-6">
        
        {/* ===== SITE HEADER ===== */}
        <header className="py-4 border-b border-slate-800/80 mb-4 flex items-center justify-between">
          {/* Brand Identity with AFC Logo & Event Title */}
          <div className="flex items-center gap-3">
            {/* AFC Logo Badge */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#1E6FBA] to-[#29ABE2] p-0.5 shadow-afc-cyan flex-shrink-0">
              <div className="w-full h-full bg-[#070A0F] rounded-[10px] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 15 L80 80 L50 65 L20 80 Z" fill="#29ABE2" />
                  <circle cx="50" cy="50" r="14" fill="#1E6FBA" />
                </svg>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="display-text text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-200 to-cyan-400">
                  THRUST 5.0
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  WATER ROCKET
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 tracking-wider">
                AERO FABRICATION CLUB · IIITDMJ
              </p>
            </div>
          </div>

          {/* Right Status & Admin Navigation */}
          <div className="flex items-center gap-3">
            <LiveStatusPill status={connectionStatus} lastUpdated={lastUpdated} />
            <Link
              to="/admin/login"
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
              title="Admin Panel Login"
            >
              <Lock size={15} />
            </Link>
          </div>
        </header>

        {/* ===== PROMINENT SEGMENTED TOGGLE SWITCH (MOBILE & DESKTOP) ===== */}
        <div className="my-2 mb-6">
          <div className="segmented-toggle">
            <button
              onClick={() => setViewMode('overall')}
              className={`segmented-btn ${viewMode === 'overall' ? 'segmented-btn-active' : ''}`}
            >
              <Rocket size={15} />
              <span>Overall Rankings</span>
            </button>
            <button
              onClick={() => setViewMode('design')}
              className={`segmented-btn ${viewMode === 'design' ? 'segmented-btn-active' : ''}`}
            >
              <Palette size={15} />
              <span>Design Marks</span>
            </button>
          </div>
        </div>

        {/* ===== HERO PODIUM SECTION ===== */}
        <div className="mb-6">
          <div className="text-center mb-3">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-cyan-400">
              {viewMode === 'overall' ? '— Top Flight Champions —' : '— Highest Rated Aircraft Designs —'}
            </h2>
          </div>
          <PodiumBlock entries={entries} viewMode={viewMode} />
        </div>

        {/* ===== LEADERBOARD TABLE SECTION ===== */}
        <div className="card-cyber overflow-hidden mb-8">
          <div className="p-3 sm:p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0D131F]/80">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                {viewMode === 'overall' ? 'Complete Leaderboard' : 'Design Score Standings'}
              </h2>
            </div>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search team or code..."
            />
          </div>

          <LeaderboardTable entries={entries} searchQuery={searchQuery} viewMode={viewMode} />
        </div>

      </div>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 border-t border-slate-800/80 py-4 bg-[#070A0F]/90 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Aero Fabrication Club (AFC IIITDMJ). All Rights Reserved.</p>
          <p className="text-[11px] font-mono text-cyan-500/70">Thrust 5.0 Water Rocket Competition Platform</p>
        </div>
      </footer>
    </div>
  )
}
