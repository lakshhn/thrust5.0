import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Rocket, Palette, Trophy, RefreshCw } from 'lucide-react'
import PodiumBlock from '../components/leaderboard/PodiumBlock.jsx'
import LeaderboardTable from '../components/leaderboard/LeaderboardTable.jsx'
import LiveStatusPill from '../components/ui/LiveStatusPill.jsx'
import SearchInput from '../components/ui/SearchInput.jsx'
import AerospaceBackground from '../components/ui/AerospaceBackground.jsx'
import AFCLogo from '../components/ui/AFCLogo.jsx'
import { computeLeaderboard, INITIAL_TEAMS } from '../data/mockData.js'
import { fetchGoogleSheetData } from '../lib/googleSheets.js'

export default function Leaderboard() {
  const [entries, setEntries] = useState(() => {
    try {
      const savedTeams = localStorage.getItem('thrust5_admin_teams')
      const savedScores = localStorage.getItem('thrust5_admin_scores')
      const localTeams = savedTeams ? JSON.parse(savedTeams) : INITIAL_TEAMS
      const localScores = savedScores ? JSON.parse(savedScores) : []
      return computeLeaderboard(localTeams, localScores)
    } catch (e) {
      return computeLeaderboard(INITIAL_TEAMS, [])
    }
  })

  const [connectionStatus, setConnectionStatus] = useState('connected')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('overall')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Combined Sync Function: Fetches Google Sheets + Merges Admin Local Overrides
  const syncAllData = async () => {
    try {
      setIsRefreshing(true)
      
      // 1. Fetch live Google Sheet rows
      const sheetTeams = await fetchGoogleSheetData()
      
      // 2. Load Local Admin Panel Teams & Scores safely
      let localTeams = []
      let localScores = []
      try {
        const savedTeams = localStorage.getItem('thrust5_admin_teams')
        const savedScores = localStorage.getItem('thrust5_admin_scores')
        if (savedTeams) localTeams = JSON.parse(savedTeams)
        if (savedScores) localScores = JSON.parse(savedScores)
      } catch (e) {
        // Fallback to empty local arrays if corrupt
      }

      // 3. Merge Datasets:
      const localScoreMap = {}
      localScores.forEach(s => {
        if (!s || !s.team_id) return
        if (!localScoreMap[s.team_id]) localScoreMap[s.team_id] = {}
        if (s.category && s.value !== undefined) {
          localScoreMap[s.team_id][s.category] = Number(s.value)
        }
      })

      // Combine teams: Start with sheet teams (or fallback initial teams if sheet is empty)
      const baseTeams = (sheetTeams && sheetTeams.length > 0) ? sheetTeams : INITIAL_TEAMS
      const mergedTeamsMap = new Map()

      baseTeams.forEach(st => {
        if (!st || !st.name) return
        const normKey = st.name.toLowerCase().trim()
        mergedTeamsMap.set(normKey, { ...st })
      })

      localTeams.forEach(lt => {
        if (!lt || !lt.name) return
        const normKey = lt.name.toLowerCase().trim()
        if (mergedTeamsMap.has(normKey)) {
          const existing = mergedTeamsMap.get(normKey)
          mergedTeamsMap.set(normKey, {
            ...existing,
            id: lt.id || existing.id,
            code: lt.code || existing.code,
            disqualified: lt.disqualified !== undefined ? lt.disqualified : existing.disqualified
          })
        } else {
          mergedTeamsMap.set(normKey, {
            id: lt.id,
            name: lt.name,
            code: lt.code,
            round_1: 0,
            round_2: 0,
            round_3: 0,
            design: 0,
            disqualified: lt.disqualified || false
          })
        }
      })

      const combinedTeamsList = Array.from(mergedTeamsMap.values())

      // Apply score overrides from local admin entries if present
      const finalScoresList = []
      combinedTeamsList.forEach(t => {
        const lScores = localScoreMap[t.id] || {}
        finalScoresList.push({
          team_id: t.id,
          round_1: lScores.round_1 !== undefined ? lScores.round_1 : (t.round_1 || 0),
          round_2: lScores.round_2 !== undefined ? lScores.round_2 : (t.round_2 || 0),
          round_3: lScores.round_3 !== undefined ? lScores.round_3 : (t.round_3 || 0),
          design:  lScores.design  !== undefined ? lScores.design  : (t.design  || 0),
        })
      })

      const computed = computeLeaderboard(combinedTeamsList, finalScoresList)
      setEntries(computed)
      setLastUpdated(new Date())
      setConnectionStatus('connected')
    } catch (err) {
      console.warn('[Leaderboard Sync Notice]:', err)
      setConnectionStatus('stale')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Periodic polling every 5 seconds for live Google Sheets updates
  useEffect(() => {
    syncAllData()

    const interval = setInterval(() => {
      syncAllData()
    }, 5000)

    const handleStorageChange = () => {
      syncAllData()
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return (
    <div className="min-h-screen relative bg-[#06090F] text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-cyan-400 selection:text-black">
      {/* Dynamic Aerospace Background */}
      <AerospaceBackground />

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col max-w-6xl w-full mx-auto px-3 sm:px-6">
        
        {/* ===== ELEGANT SITE HEADER ===== */}
        <header className="py-4 border-b border-slate-800/80 mb-6 flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand Group: Official Logo & High-Impact Title */}
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

          {/* Right Controls: Live Status & Admin Access */}
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={syncAllData}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-[#0B101D] border border-slate-700/80 text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all text-xs font-mono flex items-center gap-1.5"
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

        {/* ===== PROMINENT SEGMENTED SWITCHER (OVERALL vs DESIGN) ===== */}
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

        {/* ===== HERO PODIUM SECTION ===== */}
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

        {/* ===== LEADERBOARD TABLE SECTION ===== */}
        <div className="card-cyber overflow-hidden mb-8">
          <div className="p-3 sm:p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0B101D]">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-heading">
                {viewMode === 'overall' ? 'Official Flight Standings' : 'Design Evaluation Scoreboard'}
              </h2>
            </div>
            
            {/* Sleek Dark Search Input */}
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search team name or code..."
            />
          </div>

          <LeaderboardTable entries={entries} searchQuery={searchQuery} viewMode={viewMode} />
        </div>

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
