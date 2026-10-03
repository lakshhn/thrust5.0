/**
 * mockData.js — Thrust 5.0 Leaderboard
 *
 * INITIAL_TEAMS: Only shown when the Google Sheet returns no data at all.
 */

export const INITIAL_TEAMS = []

export const MOCK_TEAMS = []
export const MOCK_SCORES = []

/**
 * computeLeaderboard
 * Enriches raw team + score arrays into a ranked leaderboard array.
 * Total Score = Round 1 + Round 2 + Round 3 + Design - Penalty.
 * DQ'd teams are sorted to the bottom. Ranks are assigned after sorting.
 *
 * @param {Array} teams  - Array of team objects
 * @param {Array} scores - Array of { team_id, category, value } score overrides
 * @returns {Array} Sorted, ranked leaderboard entries
 */
export function computeLeaderboard(teams = [], scores = []) {
  if (!teams || teams.length === 0) return []

  const scoreMap = {}
  const safeScores = Array.isArray(scores) ? scores : []

  safeScores.forEach(s => {
    if (!s || !s.team_id) return
    if (!scoreMap[s.team_id]) {
      scoreMap[s.team_id] = {}
    }
    if (s.category && s.value !== undefined) {
      scoreMap[s.team_id][s.category] = Number(s.value) || 0
    }
    if (s.round_1 !== undefined) scoreMap[s.team_id].round_1 = Number(s.round_1) || 0
    if (s.round_2 !== undefined) scoreMap[s.team_id].round_2 = Number(s.round_2) || 0
    if (s.round_3 !== undefined) scoreMap[s.team_id].round_3 = Number(s.round_3) || 0
    if (s.design  !== undefined) scoreMap[s.team_id].design  = Number(s.design)  || 0
    if (s.penalty !== undefined) scoreMap[s.team_id].penalty = Number(s.penalty) || 0
  })

  return teams
    .map(team => {
      if (!team) return null
      const overrides = scoreMap[team.id] || {}

      const round1  = overrides.round_1 !== undefined ? overrides.round_1 : (Number(team.round_1) || 0)
      const round2  = overrides.round_2 !== undefined ? overrides.round_2 : (Number(team.round_2) || 0)
      const round3  = overrides.round_3 !== undefined ? overrides.round_3 : (Number(team.round_3) || 0)
      const design  = overrides.design  !== undefined ? overrides.design  : (Number(team.design)  || 0)
      const penalty = overrides.penalty !== undefined ? overrides.penalty : (Number(team.penalty) || 0)

      const rawTotal = round1 + round2 + round3 + design - penalty
      const total   = team.disqualified ? 0 : Math.max(0, rawTotal)

      return {
        ...team,
        round_1: round1,
        round_2: round2,
        round_3: round3,
        design,
        penalty,
        total,
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.disqualified && !b.disqualified) return 1
      if (!a.disqualified && b.disqualified) return -1
      return b.total - a.total
    })
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
}

export const MOCK_LEADERBOARD = []
