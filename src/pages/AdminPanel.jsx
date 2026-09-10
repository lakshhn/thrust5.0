import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut, Plus, CheckCircle2, AlertTriangle, User,
  Edit3, AlertOctagon, Check, X, ArrowLeft, Trash2, RotateCcw, RefreshCw
} from 'lucide-react'
import AFCLogo from '../components/ui/AFCLogo.jsx'
import { fetchGoogleSheetData } from '../lib/googleSheets.js'
import { isAdminAuthenticated, setAdminAuthenticated } from '../lib/adminAuth.js'

export default function AdminPanel() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [scores, setScores] = useState([])
  const [user, setUser] = useState({ email: 'admin@thrust5.in', id: 'admin-user' })
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [statusMessage, setStatusMessage] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)
  
  // Add team modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamCode, setNewTeamCode] = useState('')

  // Security Check: Guard admin route from unauthenticated access.
  // Auth state is in-memory only — reloading /admin always re-prompts for
  // credentials on the login screen.
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin/login', { replace: true })
    }
  }, [navigate])

  // Sync state changes to localStorage backup
  useEffect(() => {
    localStorage.setItem('thrust5_admin_teams', JSON.stringify(teams))
    localStorage.setItem('thrust5_admin_scores', JSON.stringify(scores))
  }, [teams, scores])

  // Fetch Google Sheets teams + combine with local admin state
  const loadData = async () => {
    try {
      setIsSyncing(true)
      const sheetTeams = await fetchGoogleSheetData()

      const savedTeams = localStorage.getItem('thrust5_admin_teams')
      const savedScores = localStorage.getItem('thrust5_admin_scores')
      const localTeams = savedTeams ? JSON.parse(savedTeams) : []
      const localScores = savedScores ? JSON.parse(savedScores) : []

      const mergedMap = new Map()

      sheetTeams.forEach(st => {
        const key = st.name.toLowerCase().trim()
        mergedMap.set(key, { ...st })
      })

      localTeams.forEach(lt => {
        const key = lt.name.toLowerCase().trim()
        if (mergedMap.has(key)) {
          const existing = mergedMap.get(key)
          mergedMap.set(key, { ...existing, ...lt })
        } else {
          mergedMap.set(key, { ...lt })
        }
      })

      setTeams(Array.from(mergedMap.values()))
      setScores(localScores)
    } catch (e) {
      console.warn('[AdminPanel] Initial fetch notice:', e)
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const showToast = (msg, type = 'success') => {
    setStatusMessage({ text: msg, type })
    setTimeout(() => setStatusMessage(null), 3000)
  }

  // Create New Team
  const handleAddTeam = async (e) => {
    e.preventDefault()
    if (!newTeamName.trim() || !newTeamCode.trim()) return

    const name = newTeamName.trim()
    const code = newTeamCode.trim().toUpperCase()

    const newTeamObj = {
      id: `local-${Date.now()}`,
      name,
      code,
      round_1: 0,
      round_2: 0,
      round_3: 0,
      design: 0,
      disqualified: false
    }

    setTeams(prev => [...prev, newTeamObj])
    setNewTeamName('')
    setNewTeamCode('')
    setShowAddModal(false)
    showToast(`Team "${name}" registered!`)

    // 2-Way Sync back to Google Sheet
    syncAdminUpdateToGoogleSheet('ADD_TEAM', { name, code })
  }

  // Delete Individual Team
  const handleDeleteTeam = (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to delete team "${teamName}"?`)) return
    setTeams(prev => prev.filter(t => t.id !== teamId))
    setScores(prev => prev.filter(s => s.team_id !== teamId))
    showToast(`Team "${teamName}" deleted.`)

    // 2-Way Sync back to Google Sheet
    syncAdminUpdateToGoogleSheet('DELETE_TEAM', { name: teamName })
  }

  // Clear/Purge All Teams
  const handlePurgeAllTeams = () => {
    if (!window.confirm('Wipe ALL local team overrides and reset cache?')) return
    localStorage.removeItem('thrust5_admin_teams')
    localStorage.removeItem('thrust5_admin_scores')
    setTeams([])
    setScores([])
    showToast('All local entries wiped.', 'error')
  }

  // Update Team Name
  const handleSaveTeamName = (teamId) => {
    if (!editNameValue.trim()) return
    const targetTeam = teams.find(t => t.id === teamId)
    const updatedName = editNameValue.trim()

    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, name: updatedName } : t))
    setEditingTeamId(null)
    showToast('Team name updated!')

    // 2-Way Sync back to Google Sheet
    if (targetTeam) {
      syncAdminUpdateToGoogleSheet('UPDATE_NAME', { oldName: targetTeam.name, newName: updatedName })
    }
  }

  // Toggle Disqualification
  const handleToggleDQ = (teamId) => {
    const targetTeam = teams.find(t => t.id === teamId)
    if (!targetTeam) return
    const nextDQ = !targetTeam.disqualified

    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, disqualified: nextDQ } : t))
    showToast(nextDQ ? `${targetTeam.name} flagged as DISQUALIFIED` : `${targetTeam.name} restored`, nextDQ ? 'error' : 'success')

    // 2-Way Sync back to Google Sheet
    syncAdminUpdateToGoogleSheet('UPDATE_SCORE', {
      name: targetTeam.name,
      disqualified: nextDQ ? 'YES' : 'NO'
    })
  }

  // Update Score for specific round
  const handleScoreChange = (teamId, roundKey, val) => {
    const numVal = Math.max(0, parseInt(val) || 0)
    const targetTeam = teams.find(t => t.id === teamId)

    setScores(prev => {
      const filtered = prev.filter(s => !(s.team_id === teamId && s.category === roundKey))
      return [...filtered, { team_id: teamId, category: roundKey, value: numVal }]
    })

    setTeams(prev => prev.map(t => {
      if (t.id === teamId) {
        return { ...t, [roundKey]: numVal }
      }
      return t
    }))

    // 2-Way Sync back to Google Sheet
    if (targetTeam) {
      syncAdminUpdateToGoogleSheet('UPDATE_SCORE', {
        name: targetTeam.name,
        category: roundKey,
        value: numVal
      })
    }
  }

  const handleLogout = () => {
    // In-memory flag only — nothing is persisted anywhere.
    setAdminAuthenticated(false)
    navigate('/admin/login', { replace: true })
  }

  const filteredTeams = teams.filter(t =>
    !searchQuery ||
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#06090F] text-slate-100 font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border ${
              statusMessage.type === 'error'
                ? 'bg-red-950 text-red-200 border-red-500/50'
                : 'bg-cyan-950 text-cyan-200 border-cyan-500/50'
            }`}
          >
            {statusMessage.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            <span>{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Header */}
      <header className="bg-[#0B101D] border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AFCLogo className="w-9 h-9" showText={false} />
            <div>
              <h1 className="font-heading font-extrabold text-lg sm:text-xl tracking-wider text-white flex items-center gap-2">
                THRUST 5.0 <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">ADMIN PORTAL</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">Aero Fabrication Club IIITDMJ</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors mr-2 font-mono"
            >
              <ArrowLeft size={14} /> Live Leaderboard
            </a>

            <button
              onClick={loadData}
              disabled={isSyncing}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 border border-slate-700 transition-all"
              title="Refresh Google Sheet Data"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin text-cyan-400' : ''} />
              <span className="hidden sm:inline">Sync Sheet</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all font-mono"
            >
              <LogOut size={13} /> Exit Portal
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Scoring Grid */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Controls & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B101D] p-4 rounded-xl border border-slate-800">
          <div>
            <h2 className="font-heading font-bold text-base text-white">Live Competition Control Portal</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Syncs with Google Sheet data automatically. Override Round 1, Round 2, Round 3, or Design evaluation marks anytime.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="search"
              placeholder="Search team name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-2 rounded-lg bg-[#06090F] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-56 font-mono"
            />
            
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg flex-shrink-0"
            >
              <Plus size={15} /> Add Team
            </button>

            {teams.length > 0 && (
              <button
                onClick={handlePurgeAllTeams}
                className="px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-300 font-bold text-xs flex items-center gap-1.5 transition-all font-mono"
                title="Wipe local entries"
              >
                <RotateCcw size={13} /> Reset Local Data
              </button>
            )}
          </div>
        </div>

        {/* Add Team Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#0B101D] border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-heading font-bold text-lg text-white">Add New Team</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddTeam} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Team Code (e.g. T-01)</label>
                  <input
                    type="text"
                    required
                    placeholder="T-01"
                    value={newTeamCode}
                    onChange={(e) => setNewTeamCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#06090F] border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Team Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Team Apex"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#06090F] border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs hover:bg-cyan-300 font-mono"
                  >
                    Register Team
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Unified All-Rounds Editable Score Table */}
        <div className="bg-[#0B101D] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#06090F] border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3 min-w-[200px]">Team Name</th>
                  <th className="px-3 py-3 text-center">Round 1</th>
                  <th className="px-3 py-3 text-center">Round 2</th>
                  <th className="px-3 py-3 text-center">Round 3</th>
                  <th className="px-3 py-3 text-center text-cyan-400">Design (Max 25)</th>
                  <th className="px-4 py-3 text-right">Total Score</th>
                  <th className="px-4 py-3 text-center">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredTeams.map((team) => {
                  const teamScores = scores.filter(item => item.team_id === team.id)
                  const scoreMap = {
                    round_1: team.round_1 || 0,
                    round_2: team.round_2 || 0,
                    round_3: team.round_3 || 0,
                    design:  team.design  || 0
                  }
                  
                  teamScores.forEach(s => {
                    if (s.category && s.value !== undefined) {
                      scoreMap[s.category] = Number(s.value) || 0
                    }
                  })

                  const total = team.disqualified ? 0 : (scoreMap.round_1 + scoreMap.round_2 + scoreMap.round_3 + scoreMap.design)
                  const isEditingName = editingTeamId === team.id

                  return (
                    <tr
                      key={team.id}
                      className={`transition-colors ${
                        team.disqualified
                          ? 'bg-red-950/30 border-l-4 border-l-red-500 hover:bg-red-950/50'
                          : 'hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Code */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-400">
                        {team.code}
                      </td>

                      {/* Team Name (Editable) */}
                      <td className="px-4 py-3">
                        {isEditingName ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editNameValue}
                              onChange={(e) => setEditNameValue(e.target.value)}
                              className="px-2 py-1 bg-[#06090F] border border-cyan-500 rounded text-xs text-white focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveTeamName(team.id)}
                              className="p-1 rounded bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                              title="Save name"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => setEditingTeamId(null)}
                              className="p-1 rounded bg-slate-800 text-slate-400 hover:bg-slate-700"
                              title="Cancel"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <span className={`font-semibold ${team.disqualified ? 'text-red-300 line-through' : 'text-white'}`}>
                              {team.name}
                            </span>
                            <button
                              onClick={() => { setEditingTeamId(team.id); setEditNameValue(team.name) }}
                              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-cyan-400 transition-opacity p-0.5"
                              title="Edit team name"
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Round 1 Score */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          disabled={team.disqualified}
                          value={scoreMap.round_1}
                          onChange={(e) => handleScoreChange(team.id, 'round_1', e.target.value)}
                          className="w-16 text-center py-1 bg-[#06090F] border border-slate-700 rounded text-xs font-mono font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-30"
                          min={0}
                        />
                      </td>

                      {/* Round 2 Score */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          disabled={team.disqualified}
                          value={scoreMap.round_2}
                          onChange={(e) => handleScoreChange(team.id, 'round_2', e.target.value)}
                          className="w-16 text-center py-1 bg-[#06090F] border border-slate-700 rounded text-xs font-mono font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-30"
                          min={0}
                        />
                      </td>

                      {/* Round 3 Score */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          disabled={team.disqualified}
                          value={scoreMap.round_3}
                          onChange={(e) => handleScoreChange(team.id, 'round_3', e.target.value)}
                          className="w-16 text-center py-1 bg-[#06090F] border border-slate-700 rounded text-xs font-mono font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-30"
                          min={0}
                        />
                      </td>

                      {/* Design Marks */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          disabled={team.disqualified}
                          value={scoreMap.design}
                          onChange={(e) => handleScoreChange(team.id, 'design', e.target.value)}
                          className="w-16 text-center py-1 bg-[#06090F] border border-cyan-500/50 rounded text-xs font-mono font-semibold text-cyan-400 focus:outline-none focus:border-cyan-400 disabled:opacity-30"
                          min={0}
                          max={25}
                        />
                      </td>

                      {/* Total Score */}
                      <td className="px-4 py-3 text-right font-mono font-extrabold text-sm">
                        {team.disqualified ? (
                          <span className="text-red-400 text-xs">0 (DQ)</span>
                        ) : (
                          <span className="text-cyan-400">{total}</span>
                        )}
                      </td>

                      {/* DQ Action & Delete Buttons */}
                      <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleDQ(team.id)}
                          className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold tracking-wider transition-all flex items-center gap-1 border ${
                            team.disqualified
                              ? 'bg-red-900/80 text-red-200 border-red-500 hover:bg-red-800'
                              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-red-950 hover:text-red-300 hover:border-red-500/50'
                          }`}
                        >
                          <AlertOctagon size={11} />
                          {team.disqualified ? 'DISQUALIFIED' : 'FLAG DQ'}
                        </button>

                        <button
                          onClick={() => handleDeleteTeam(team.id, team.name)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-red-900 text-slate-400 hover:text-red-200 transition-colors border border-slate-700 hover:border-red-500/50"
                          title="Delete Team"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredTeams.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-sm space-y-2 font-mono">
                <p>No teams found in Google Sheet or local entries.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs hover:bg-cyan-300 shadow-lg inline-flex items-center gap-1.5 font-sans"
                >
                  <Plus size={14} /> Add Team Manually
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
