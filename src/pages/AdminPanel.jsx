import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut, Plus, CheckCircle2, AlertTriangle,
  Edit3, AlertOctagon, Check, X, ArrowLeft, Trash2, RotateCcw, RefreshCw
} from 'lucide-react'
import AFCLogo from '../components/ui/AFCLogo.jsx'
import { fetchGoogleSheetData, syncAdminUpdateToGoogleSheet, invalidateCache } from '../lib/googleSheets.js'
import { isAdminAuthenticated, setAdminAuthenticated } from '../lib/adminAuth.js'

// ─── Normalise name for dedup comparison ─────────────────────
function normName(n) {
  return (n || '').toString().trim().toLowerCase()
}

export default function AdminPanel() {
  const navigate = useNavigate()

  // teams is always the sheet's data + any not-yet-confirmed adds
  const [teams, setTeams] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [statusMessage, setStatusMessage] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Score inputs: debounce 800ms so rapid keystrokes don't flood the sheet
  const scoreDebounceRef = useRef({})

  // Add team modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamCode, setNewTeamCode] = useState('')

  // ── Auth guard ─────────────────────────────────────────────
  useEffect(() => {
    if (!isAdminAuthenticated()) navigate('/admin/login', { replace: true })
  }, [navigate])

  // ── Toast ──────────────────────────────────────────────────
  const showToast = useCallback((text, type = 'success') => {
    setStatusMessage({ text, type })
    setTimeout(() => setStatusMessage(null), 3500)
  }, [])

  // ── Signal leaderboard tab to re-fetch ─────────────────────
  const notifyLeaderboard = useCallback(() => {
    try { localStorage.setItem('thrust5_sheet_invalidate', Date.now().toString()) } catch (_) {}
  }, [])

  // ── Load from Google Sheet (always authoritative) ──────────
  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setIsSyncing(true)
    try {
      invalidateCache()
      const sheetTeams = await fetchGoogleSheetData(true)

      // Sheet is the source of truth — set directly, no local merge needed
      // (local-only adds are merged in below)
      setTeams(prev => {
        // Keep any optimistically-added teams that haven't appeared in sheet yet
        const sheetNames = new Set(sheetTeams.map(t => normName(t.name)))
        const localOnly = prev.filter(t => t.source === 'local' && !sheetNames.has(normName(t.name)))
        return [...sheetTeams, ...localOnly]
      })
    } catch (err) {
      console.warn('[AdminPanel] Load error:', err)
      showToast('Could not reach Google Sheet. Showing last known data.', 'error')
    } finally {
      if (!quiet) setIsSyncing(false)
    }
  }, [showToast])

  useEffect(() => { loadData() }, [loadData])

  // ── Add Team ───────────────────────────────────────────────
  const handleAddTeam = async (e) => {
    e.preventDefault()
    const name = newTeamName.trim()
    const code = newTeamCode.trim().toUpperCase()
    if (!name || !code) return

    // Local dedup check
    if (teams.some(t => normName(t.name) === normName(name))) {
      showToast(`"${name}" already exists.`, 'error')
      return
    }

    // Optimistic add
    const tempTeam = {
      id: `local-${Date.now()}`,
      name, code,
      round_1: 0, round_2: 0, round_3: 0, design: 0,
      disqualified: false, total: 0,
      source: 'local',
    }
    setTeams(prev => [...prev, tempTeam])
    setNewTeamName('')
    setNewTeamCode('')
    setShowAddModal(false)
    showToast(`Team "${name}" added!`)

    const ok = await syncAdminUpdateToGoogleSheet('ADD_TEAM', { name, code })
    if (ok) {
      notifyLeaderboard()
      // Re-fetch after 2s so sheet-assigned row replaces our local temp
      setTimeout(() => loadData(true), 2000)
    } else {
      showToast('Added locally — sheet sync failed. Try again.', 'error')
    }
  }

  // ── Delete Team ────────────────────────────────────────────
  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Delete "${teamName}" from the leaderboard? This also removes them from the Google Sheet.`)) return

    setTeams(prev => prev.filter(t => t.id !== teamId))
    showToast(`"${teamName}" deleted.`)

    const ok = await syncAdminUpdateToGoogleSheet('DELETE_TEAM', { name: teamName })
    if (ok) {
      notifyLeaderboard()
    } else {
      showToast('Delete failed on sheet — reloading.', 'error')
      setTimeout(() => loadData(true), 1000)
    }
  }

  // ── Rename Team ────────────────────────────────────────────
  const handleSaveTeamName = async (teamId) => {
    const newName = editNameValue.trim()
    if (!newName) return

    const team = teams.find(t => t.id === teamId)
    if (!team) return

    if (teams.some(t => t.id !== teamId && normName(t.name) === normName(newName))) {
      showToast(`"${newName}" already exists.`, 'error')
      return
    }

    const oldName = team.name
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, name: newName } : t))
    setEditingTeamId(null)
    showToast('Team name updated!')

    const ok = await syncAdminUpdateToGoogleSheet('UPDATE_NAME', { oldName, newName })
    if (ok) {
      notifyLeaderboard()
    } else {
      showToast('Name update failed on sheet.', 'error')
      // Revert
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, name: oldName } : t))
    }
  }

  // ── Toggle DQ ──────────────────────────────────────────────
  const handleToggleDQ = async (teamId) => {
    const team = teams.find(t => t.id === teamId)
    if (!team) return

    const nextDQ = !team.disqualified
    const newTotal = nextDQ ? 0 : (team.round_1 || 0) + (team.round_2 || 0) + (team.round_3 || 0) + (team.design || 0)

    // Optimistic
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, disqualified: nextDQ, total: newTotal } : t
    ))
    showToast(
      nextDQ ? `${team.name} flagged as DISQUALIFIED` : `${team.name} reinstated`,
      nextDQ ? 'error' : 'success'
    )

    const ok = await syncAdminUpdateToGoogleSheet('UPDATE_SCORE', {
      name: team.name,
      disqualified: nextDQ ? 'YES' : 'NO',
    })
    if (ok) {
      notifyLeaderboard()
    } else {
      // Revert on failure
      showToast('DQ update failed on sheet.', 'error')
      setTeams(prev => prev.map(t =>
        t.id === teamId ? { ...t, disqualified: team.disqualified, total: team.total } : t
      ))
    }
  }

  // ── Score change (debounced 800ms) ─────────────────────────
  const handleScoreChange = (teamId, category, rawVal) => {
    const val = Math.max(0, parseInt(rawVal) || 0)

    // Optimistic — update UI immediately
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t
      const updated = { ...t, [category]: val }
      if (!updated.disqualified) {
        const p = category === 'penalty' ? val : (updated.penalty || 0)
        const rawT = (updated.round_1 || 0) + (updated.round_2 || 0) + (updated.round_3 || 0) + (updated.design || 0) - p
        updated.total = Math.max(0, rawT)
      }
      return updated
    }))

    // Debounce the sheet write
    const key = `${teamId}_${category}`
    clearTimeout(scoreDebounceRef.current[key])
    scoreDebounceRef.current[key] = setTimeout(async () => {
      // Read the latest team name from state at write time (avoids stale closure)
      setTeams(currentTeams => {
        const team = currentTeams.find(t => t.id === teamId)
        if (team) {
          syncAdminUpdateToGoogleSheet('UPDATE_SCORE', {
            name: team.name,
            category,
            value: val,
          }).then(ok => { if (ok) notifyLeaderboard() })
        }
        return currentTeams // no state change, just reading
      })
    }, 800)
  }

  const handleLogout = () => {
    setAdminAuthenticated(false)
    navigate('/admin/login', { replace: true })
  }

  const filteredTeams = teams.filter(t =>
    !searchQuery ||
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#06090F] text-slate-100 font-sans">

      {/* Toast */}
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

      {/* Header */}
      <header className="bg-[#0B101D] border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AFCLogo className="w-9 h-9" showText={false} />
            <div>
              <h1 className="font-heading font-extrabold text-lg sm:text-xl tracking-wider text-white flex items-center gap-2">
                THRUST 5.0{' '}
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  ADMIN PORTAL
                </span>
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
              onClick={() => loadData()}
              disabled={isSyncing}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 border border-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin text-cyan-400' : ''} />
              <span className="hidden sm:inline">Sync Sheet</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all font-mono"
            >
              <LogOut size={13} /> Exit
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">

        {/* Controls bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B101D] p-4 rounded-xl border border-slate-800">
          <div>
            <h2 className="font-heading font-bold text-base text-white">Live Competition Control Portal</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every change syncs to Google Sheet in real time. Total column auto-updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="search"
              placeholder="Search team name or code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3.5 py-2 rounded-lg bg-[#06090F] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-56 font-mono"
            />

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg flex-shrink-0"
            >
              <Plus size={15} /> Add Team
            </button>

            <button
              onClick={() => loadData()}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 font-bold text-xs flex items-center gap-1.5 transition-all font-mono"
              title="Reload from Google Sheet"
            >
              <RotateCcw size={13} /> Reload Sheet
            </button>
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
                    onChange={e => setNewTeamCode(e.target.value)}
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
                    onChange={e => setNewTeamName(e.target.value)}
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

        {/* Score Table */}
        <div className="bg-[#0B101D] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#06090F] border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                  <th className="px-4 py-3 whitespace-nowrap">Code</th>
                  <th className="px-4 py-3 min-w-[180px]">Team Name</th>
                  <th className="px-3 py-3 text-center">Round 1</th>
                  <th className="px-3 py-3 text-center">Round 2</th>
                  <th className="px-3 py-3 text-center">Round 3</th>
                  <th className="px-3 py-3 text-center text-cyan-400">Design (Max 25)</th>
                  <th className="px-3 py-3 text-center text-rose-400">Penalty</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center min-w-[160px]">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTeams.map(team => {
                  const r1      = team.round_1 || 0
                  const r2      = team.round_2 || 0
                  const r3      = team.round_3 || 0
                  const design  = team.design  || 0
                  const penalty = team.penalty || 0
                  const total   = team.disqualified ? 0 : Math.max(0, r1 + r2 + r3 + design - penalty)
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
                      <td className="px-4 py-3 font-mono font-bold text-slate-400 whitespace-nowrap">
                        {team.code}
                      </td>

                      {/* Team Name */}
                      <td className="px-4 py-3">
                        {isEditingName ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editNameValue}
                              onChange={e => setEditNameValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter')  handleSaveTeamName(team.id)
                                if (e.key === 'Escape') setEditingTeamId(null)
                              }}
                              className="px-2 py-1 bg-[#06090F] border border-cyan-500 rounded text-xs text-white focus:outline-none w-36"
                              autoFocus
                            />
                            <button onClick={() => handleSaveTeamName(team.id)} className="p-1 rounded bg-cyan-400 text-slate-950 hover:bg-cyan-300" title="Save">
                              <Check size={13} />
                            </button>
                            <button onClick={() => setEditingTeamId(null)} className="p-1 rounded bg-slate-800 text-slate-400 hover:bg-slate-700" title="Cancel">
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <span className={`font-semibold ${team.disqualified ? 'text-red-300 line-through' : 'text-white'}`}>
                              {team.name}
                            </span>
                            {team.source === 'local' && (
                              <span className="text-[9px] text-yellow-500 font-mono border border-yellow-500/30 px-1 rounded">pending</span>
                            )}
                            <button
                              onClick={() => { setEditingTeamId(team.id); setEditNameValue(team.name) }}
                              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-cyan-400 transition-opacity p-0.5"
                              title="Edit name"
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Round 1 */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          disabled={team.disqualified}
                          value={r1}
                          onChange={e => handleScoreChange(team.id, 'round_1', e.target.value)}
                          className="w-16 text-center py-1 bg-[#06090F] border border-slate-700 rounded text-xs font-mono font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-30"
                          min={0}
                        />
                      </td>

                      {/* Round 2 */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          disabled={team.disqualified}
                          value={r2}
                          onChange={e => handleScoreChange(team.id, 'round_2', e.target.value)}
                          className="w-16 text-center py-1 bg-[#06090F] border border-slate-700 rounded text-xs font-mono font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-30"
                          min={0}
                        />
                      </td>

                      {/* Round 3 */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          disabled={team.disqualified}
                          value={r3}
                          onChange={e => handleScoreChange(team.id, 'round_3', e.target.value)}
                          className="w-16 text-center py-1 bg-[#06090F] border border-slate-700 rounded text-xs font-mono font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-30"
                          min={0}
                        />
                      </td>

                      {/* Design */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          disabled={team.disqualified}
                          value={design}
                          onChange={e => handleScoreChange(team.id, 'design', e.target.value)}
                          className="w-16 text-center py-1 bg-[#06090F] border border-cyan-500/50 rounded text-xs font-mono font-semibold text-cyan-400 focus:outline-none focus:border-cyan-400 disabled:opacity-30"
                          min={0}
                          max={25}
                        />
                      </td>

                      {/* Penalty */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          disabled={team.disqualified}
                          value={penalty}
                          onChange={e => handleScoreChange(team.id, 'penalty', e.target.value)}
                          className="w-16 text-center py-1 bg-[#06090F] border border-rose-500/50 rounded text-xs font-mono font-semibold text-rose-400 focus:outline-none focus:border-rose-400 disabled:opacity-30"
                          min={0}
                        />
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 text-right font-mono font-extrabold text-sm">
                        {team.disqualified
                          ? <span className="text-red-400 text-xs">0 (DQ)</span>
                          : <span className="text-cyan-400">{total}</span>
                        }
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
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
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredTeams.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-sm space-y-2 font-mono">
                {isSyncing ? (
                  <p className="animate-pulse">Loading from Google Sheet…</p>
                ) : (
                  <>
                    <p>{searchQuery ? `No teams matching "${searchQuery}"` : 'No teams found in sheet.'}</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-3.5 py-2 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs hover:bg-cyan-300 shadow-lg inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Add Team
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
