import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut, Users, RefreshCw, Upload, CheckCircle2,
  AlertTriangle, Clock, ChevronDown, RotateCcz, Save,
  Database, FileSpreadsheet, User
} from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { MOCK_TEAMS, MOCK_SCORES } from '../data/mockData.js'

const ROUNDS = [
  { key: 'round_1', label: 'Round 1' },
  { key: 'round_2', label: 'Round 2' },
  { key: 'round_3', label: 'Round 3' },
  { key: 'design',  label: 'Design Marks' },
]

// Score input cell with save state tracking
function ScoreCell({ teamId, roundKey, currentValue, lastEditedBy, lastEditedAt, onSave, adminRole }) {
  const [editValue, setEditValue] = useState(String(currentValue ?? ''))
  const [isEditing, setIsEditing] = useState(false)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error
  const [showConfirm, setShowConfirm] = useState(false)
  const [undoValue, setUndoValue] = useState(null)
  const [showUndo, setShowUndo] = useState(false)

  useEffect(() => {
    setEditValue(String(currentValue ?? ''))
  }, [currentValue])

  const handleSave = async () => {
    const numVal = parseInt(editValue)
    if (isNaN(numVal) || numVal < 0) {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 2000)
      return
    }

    // If overwriting a non-empty value, require confirmation
    if (currentValue !== null && currentValue !== undefined && currentValue !== numVal && !showConfirm) {
      setShowConfirm(true)
      return
    }

    setShowConfirm(false)
    setSaveState('saving')
    setUndoValue(currentValue)

    try {
      await onSave(teamId, roundKey, numVal, currentValue)
      setSaveState('saved')
      setIsEditing(false)
      setShowUndo(true)
      setTimeout(() => {
        setSaveState('idle')
        setShowUndo(false)
      }, 10000)
    } catch (err) {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }

  const handleUndo = async () => {
    if (undoValue === null) return
    setSaveState('saving')
    try {
      await onSave(teamId, roundKey, undoValue, parseInt(editValue))
      setSaveState('saved')
      setEditValue(String(undoValue ?? ''))
      setShowUndo(false)
      setUndoValue(null)
      setTimeout(() => setSaveState('idle'), 2000)
    } catch (err) {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }

  return (
    <td className="px-4 py-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            type="number"
            id={`score-${teamId}-${roundKey}`}
            className="score-input"
            value={editValue}
            onChange={(e) => { setEditValue(e.target.value); setIsEditing(true) }}
            onFocus={() => setIsEditing(true)}
            min={0}
            max={999}
            aria-label={`Score for team ${teamId}, ${roundKey}`}
          />

          {/* Save / confirm buttons */}
          {isEditing && (
            <div className="flex gap-1">
              {showConfirm ? (
                <>
                  <button
                    className="btn-danger text-xs px-2 py-1"
                    onClick={handleSave}
                    aria-label="Confirm overwrite"
                  >
                    Overwrite
                  </button>
                  <button
                    className="btn-secondary text-xs px-2 py-1"
                    onClick={() => { setShowConfirm(false); setEditValue(String(currentValue ?? '')) }}
                    aria-label="Cancel edit"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="btn-primary text-xs px-2 py-1"
                  onClick={handleSave}
                  disabled={saveState === 'saving'}
                  aria-label="Save score"
                >
                  {saveState === 'saving' ? '…' : 'Save'}
                </button>
              )}
            </div>
          )}

          {/* Save state indicator */}
          <span className="text-xs flex-shrink-0">
            {saveState === 'saving' && (
              <span className="save-indicator-saving flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" /> Saving
              </span>
            )}
            {saveState === 'saved' && (
              <span className="save-indicator-saved flex items-center gap-1">
                <CheckCircle2 size={10} /> Saved
              </span>
            )}
            {saveState === 'error' && (
              <span className="save-indicator-error flex items-center gap-1">
                <AlertTriangle size={10} /> Error
              </span>
            )}
          </span>

          {/* Undo button */}
          <AnimatePresence>
            {showUndo && undoValue !== null && (
              <motion.button
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs underline"
                style={{ color: 'var(--thrust-blue)' }}
                onClick={handleUndo}
                aria-label="Undo last score change"
              >
                Undo
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Last edited metadata */}
        {lastEditedBy && lastEditedAt && (
          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
            {lastEditedBy} · {new Date(lastEditedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </td>
  )
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const [activeRound, setActiveRound] = useState('round_1')
  const [teams, setTeams] = useState(MOCK_TEAMS)
  const [scores, setScores] = useState(MOCK_SCORES)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState('admin') // 'admin' | 'super_admin'
  const [syncStatus, setSyncStatus] = useState({ lastPush: null, lastPull: null, hasConflicts: false })
  const [searchQuery, setSearchQuery] = useState('')

  // Check auth on mount
  useEffect(() => {
    if (!supabase) {
      // Dev mode: mock user
      setUser({ email: 'admin@thrust5.in', id: 'dev-user' })
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/admin/login')
        return
      }
      setUser(session.user)
      // Fetch role from admins table
      supabase
        .from('admins')
        .select('role')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.role) setUserRole(data.role)
        })
    })
  }, [navigate])

  // Subscribe to real-time score updates in admin panel
  useEffect(() => {
    if (!supabase || !user) return

    const channel = supabase
      .channel('admin-scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, async () => {
        const { data } = await supabase.from('scores').select('team_id, category, value, updated_at, updated_by')
        if (data) setScores(data)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  const handleScoreSave = async (teamId, roundKey, newValue, oldValue) => {
    if (supabase) {
      const { error } = await supabase.rpc('upsert_score', {
        p_team_id: teamId,
        p_category: roundKey,
        p_value: newValue,
        p_updated_by: user?.id,
      })
      if (error) throw error

      // Trigger Excel push (via Edge Function)
      try {
        await supabase.functions.invoke('push-to-sheets', {
          body: { teamId, category: roundKey, value: newValue },
        })
        setSyncStatus(s => ({ ...s, lastPush: new Date().toISOString() }))
      } catch (err) {
        console.warn('[Admin] Sheet push failed:', err)
      }
    } else {
      // Dev mode: update mock scores
      setScores(prev =>
        prev.map(s =>
          s.team_id === teamId
            ? { ...s, [roundKey]: newValue }
            : s
        )
      )
    }
  }

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const getScoreForTeamRound = (teamId, roundKey) => {
    const s = scores.find(s => s.team_id === teamId)
    return s ? s[roundKey] : null
  }

  const filteredTeams = teams.filter(t =>
    !searchQuery ||
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!user) return null // Will redirect via useEffect

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Admin Header */}
      <header className="site-header" role="banner">
        <div className="flex items-center justify-between px-4 md:px-6 h-16">
          <div className="flex items-center gap-4">
            <div>
              <h1
                className="display-text text-2xl tracking-widest leading-none"
                style={{ color: 'var(--text-primary)' }}
              >
                THRUST 5.0
              </h1>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                Admin Panel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Current user */}
            <div className="hidden md:flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <User size={13} strokeWidth={1.5} aria-hidden="true" />
              <span>{user.email}</span>
              {userRole === 'super_admin' && (
                <span
                  className="text-[10px] uppercase px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: 'rgba(255,90,31,0.12)',
                    color: 'var(--ignition)',
                    border: '1px solid rgba(255,90,31,0.25)',
                  }}
                >
                  Super Admin
                </span>
              )}
            </div>

            {/* Back to leaderboard */}
            <a
              href="/"
              className="hidden md:inline text-xs"
              style={{ color: 'var(--text-faint)' }}
            >
              ← Leaderboard
            </a>

            {/* Logout */}
            <button
              id="admin-logout"
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              onClick={handleLogout}
              aria-label="Sign out of admin panel"
            >
              <LogOut size={13} strokeWidth={2} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Sync Status Strip */}
      <div className="sync-strip" role="status" aria-label="Sync status">
        <div className="flex items-center gap-1.5">
          <FileSpreadsheet size={12} aria-hidden="true" />
          <span>Sheet sync:</span>
          {syncStatus.lastPush ? (
            <span style={{ color: 'var(--success)' }}>
              Last push {new Date(syncStatus.lastPush).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          ) : (
            <span style={{ color: 'var(--text-faint)' }}>No push yet this session</span>
          )}
        </div>
        {syncStatus.hasConflicts && (
          <div className="flex items-center gap-1.5" style={{ color: 'var(--danger)' }}>
            <AlertTriangle size={12} aria-hidden="true" />
            <span>Conflicts detected — resolve in Super Admin tab</span>
          </div>
        )}
        {userRole === 'super_admin' && (
          <button
            id="manual-resync"
            className="ml-auto flex items-center gap-1 text-xs"
            style={{ color: 'var(--thrust-blue)' }}
            onClick={() => {
              // Trigger manual resync
              console.log('[Admin] Manual resync triggered')
              setSyncStatus(s => ({ ...s, lastPush: new Date().toISOString() }))
            }}
            aria-label="Trigger manual Google Sheets resync"
          >
            <RefreshCw size={11} strokeWidth={2} aria-hidden="true" />
            Resync now
          </button>
        )}
      </div>

      <div className="admin-layout">
        {/* Sidebar — round tabs */}
        <aside className="admin-sidebar p-4" role="navigation" aria-label="Admin navigation">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-faint)' }}>
              Scoring Rounds
            </p>
            <div className="space-y-1">
              {ROUNDS.map(({ key, label }) => (
                <button
                  key={key}
                  id={`round-tab-${key}`}
                  className={`round-tab w-full text-left ${activeRound === key ? 'round-tab-active' : ''}`}
                  onClick={() => setActiveRound(key)}
                  aria-pressed={activeRound === key}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Super Admin actions */}
          {userRole === 'super_admin' && (
            <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-faint)' }}>
                Super Admin
              </p>
              <button
                id="manage-teams-btn"
                className="round-tab w-full text-left flex items-center gap-2"
                aria-label="Manage teams"
              >
                <Users size={13} aria-hidden="true" />
                Manage Teams
              </button>
              <button
                id="bulk-import-btn"
                className="round-tab w-full text-left flex items-center gap-2 mt-1"
                aria-label="Bulk import scores from CSV or Google Sheets"
              >
                <Upload size={13} aria-hidden="true" />
                Bulk Import
              </button>
            </div>
          )}
        </aside>

        {/* Main score entry area */}
        <main className="p-4 md:p-6" role="main">
          {/* Round header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                {ROUNDS.find(r => r.key === activeRound)?.label}
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {filteredTeams.length} teams · Click a score to edit
              </p>
            </div>

            {/* Search */}
            <input
              type="search"
              id="admin-team-search"
              className="search-input"
              placeholder="Search teams…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter teams by name"
            />
          </div>

          {/* Score entry table */}
          <div className="card overflow-hidden">
            <table
              className="leaderboard-table w-full"
              aria-label={`Score entry for ${ROUNDS.find(r => r.key === activeRound)?.label}`}
            >
              <thead>
                <tr>
                  <th className="text-left pl-4 pr-2 py-3" scope="col">Team</th>
                  <th className="text-left px-4 py-3" scope="col">
                    {ROUNDS.find(r => r.key === activeRound)?.label} Score
                  </th>
                  <th className="text-left px-4 py-3 hidden md:table-cell" scope="col">Last Edited By</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team) => {
                  const score = scores.find(s => s.team_id === team.id)
                  return (
                    <tr
                      key={team.id}
                      className="leaderboard-row"
                      role="row"
                      aria-label={`Score entry row for ${team.name}`}
                    >
                      {/* Team info */}
                      <td className="pl-4 pr-2 py-3">
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          {team.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                          {team.code}
                        </p>
                      </td>

                      {/* Score cell */}
                      <ScoreCell
                        teamId={team.id}
                        roundKey={activeRound}
                        currentValue={score?.[activeRound] ?? null}
                        lastEditedBy={score?.updated_by || null}
                        lastEditedAt={score?.updated_at || null}
                        onSave={handleScoreSave}
                        adminRole={userRole}
                      />

                      {/* Last edited by (desktop) */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        {score?.updated_by ? (
                          <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
                            <div className="flex items-center gap-1">
                              <User size={11} aria-hidden="true" />
                              <span>{score.updated_by}</span>
                            </div>
                            {score.updated_at && (
                              <p className="mt-0.5">
                                {new Date(score.updated_at).toLocaleString('en-IN', {
                                  month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Not entered</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}
