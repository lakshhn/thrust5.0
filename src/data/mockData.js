// Mock data for development and demo
// In production, all data comes from Supabase Realtime

export const MOCK_TEAMS = [
  { id: '1', name: 'Team Apex', code: 'T-01', logo_url: null, college: 'IIT Delhi' },
  { id: '2', name: 'Team Falcon', code: 'T-02', logo_url: null, college: 'IIT Bombay' },
  { id: '3', name: 'Team Orbit', code: 'T-03', logo_url: null, college: 'IIT Madras' },
  { id: '4', name: 'Team Zenith', code: 'T-04', logo_url: null, college: 'NIT Trichy' },
  { id: '5', name: 'Team Nova', code: 'T-05', logo_url: null, college: 'BITS Pilani' },
  { id: '6', name: 'Team Stratos', code: 'T-06', logo_url: null, college: 'IIT Kharagpur' },
  { id: '7', name: 'Team Vortex', code: 'T-07', logo_url: null, college: 'IIT Roorkee' },
  { id: '8', name: 'Team Athena', code: 'T-08', logo_url: null, college: 'BITS Goa' },
  { id: '9', name: 'Team Phoenix', code: 'T-09', logo_url: null, college: 'IIT Kanpur' },
  { id: '10', name: 'Team Horizon', code: 'T-10', logo_url: null, college: 'NIT Surathkal' },
  { id: '11', name: 'Team Astra', code: 'T-11', logo_url: null, college: 'IIT Hyderabad' },
  { id: '12', name: 'Team Vega', code: 'T-12', logo_url: null, college: 'BITS Hyd' },
  { id: '13', name: 'Team Delta', code: 'T-13', logo_url: null, college: 'IIT BHU' },
  { id: '14', name: 'Team Sigma', code: 'T-14', logo_url: null, college: 'NIT Warangal' },
  { id: '15', name: 'Team Pulsar', code: 'T-15', logo_url: null, college: 'IIT Gandhinagar' },
]

export const MOCK_SCORES = [
  { team_id: '1',  round_1: 92, round_2: 88, round_3: 95, design: 22 },
  { team_id: '2',  round_1: 87, round_2: 91, round_3: 89, design: 20 },
  { team_id: '3',  round_1: 85, round_2: 86, round_3: 90, design: 24 },
  { team_id: '4',  round_1: 80, round_2: 84, round_3: 82, design: 19 },
  { team_id: '5',  round_1: 78, round_2: 83, round_3: 85, design: 21 },
  { team_id: '6',  round_1: 75, round_2: 79, round_3: 80, design: 18 },
  { team_id: '7',  round_1: 72, round_2: 76, round_3: 78, design: 17 },
  { team_id: '8',  round_1: 68, round_2: 74, round_3: 76, design: 20 },
  { team_id: '9',  round_1: 65, round_2: 71, round_3: 73, design: 16 },
  { team_id: '10', round_1: 63, round_2: 69, round_3: 70, design: 15 },
  { team_id: '11', round_1: 60, round_2: 65, round_3: 68, design: 14 },
  { team_id: '12', round_1: 58, round_2: 62, round_3: 65, design: 18 },
  { team_id: '13', round_1: 55, round_2: 60, round_3: 62, design: 13 },
  { team_id: '14', round_1: 52, round_2: 57, round_3: 59, design: 12 },
  { team_id: '15', round_1: 50, round_2: 54, round_3: 56, design: 11 },
]

/**
 * Compute enriched leaderboard entries from teams + scores
 * Returns array sorted by total score descending
 */
export function computeLeaderboard(teams, scores) {
  const scoreMap = {}
  scores.forEach(s => { scoreMap[s.team_id] = s })

  return teams
    .map(team => {
      const s = scoreMap[team.id] || { round_1: 0, round_2: 0, round_3: 0, design: 0 }
      const total = (s.round_1 || 0) + (s.round_2 || 0) + (s.round_3 || 0) + (s.design || 0)
      return {
        ...team,
        round_1: s.round_1 || 0,
        round_2: s.round_2 || 0,
        round_3: s.round_3 || 0,
        design: s.design || 0,
        total,
      }
    })
    .sort((a, b) => b.total - a.total)
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
}

export const MOCK_LEADERBOARD = computeLeaderboard(MOCK_TEAMS, MOCK_SCORES)
