/**
 * mockData.js — Thrust 5.0 Leaderboard
 *
 * INITIAL_TEAMS: Only shown when the Google Sheet returns no data at all
 * (e.g. fresh deploy before any teams are added, or network failure).
 * Once the sheet has teams, these are never shown.
 */

export const INITIAL_TEAMS = []

export const MOCK_TEAMS = []
export const MOCK_SCORES = []

/**
 * computeLeaderboard
 * Enriches raw team + score arrays into a ranked leaderboard array.
 * DQ'd teams are sorted to the bottom. Ranks are assigned after sorting.
 *
 * @param {Array} teams  - Array of team objects
 * @param {Array} scores - Array of { team_id, category, value } score overrides
 * @returns {Array} Sorted, ranked leaderboard entries
 */
export function computeLeaderboard(teams = [], scores = []) {
  // If no teams provided, return empty — never show fake placeholder teams
  if (!teams || teams.length === 0) return []

  // Build score override map: team_id → { round_1, round_2, round_3, design }
  const scoreMap = {}
  const safeScores = Array.isArray(scores) ? scores : []

  safeScores.forEach(s => {
    if (!s || !s.team_id) return
    if (!scoreMap[s.team_id]) {
      scoreMap[s.team_id] = {}
    }
    // Category-based override: { team_id, category: 'round_1', value: 45 }
    if (s.category && s.value !== undefined) {
      scoreMap[s.team_id][s.category] = Number(s.value) || 0
    }
    // Direct field overrides
    if (s.round_1 !== undefined) scoreMap[s.team_id].round_1 = Number(s.round_1) || 0
    if (s.round_2 !== undefined) scoreMap[s.team_id].round_2 = Number(s.round_2) || 0
    if (s.round_3 !== undefined) scoreMap[s.team_id].round_3 = Number(s.round_3) || 0
    if (s.design  !== undefined) scoreMap[s.team_id].design  = Number(s.design)  || 0
  })

  return teams
    .map(team => {
      if (!team) return null
      const overrides = scoreMap[team.id] || {}

      // Score override takes precedence over team's own field
      const round1  = overrides.round_1 !== undefined ? overrides.round_1 : (Number(team.round_1) || 0)
      const round2  = overrides.round_2 !== undefined ? overrides.round_2 : (Number(team.round_2) || 0)
      const round3  = overrides.round_3 !== undefined ? overrides.round_3 : (Number(team.round_3) || 0)
      const design  = overrides.design  !== undefined ? overrides.design  : (Number(team.design)  || 0)
      const total   = team.disqualified ? 0 : round1 + round2 + round3 + design

      return { ...team, round_1: round1, round_2: round2, round_3: round3, design, total }
    })
    .filter(Boolean)
    .sort((a, b) => {
      // DQ teams always go to the bottom
      if (a.disqualified && !b.disqualified) return 1
      if (!a.disqualified && b.disqualified) return -1
      // Otherwise sort by total descending
      return b.total - a.total
    })
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
}

export const MOCK_LEADERBOARD = []
