// Default starter competition entries to ensure zero blank blue screens
export const INITIAL_TEAMS = [
  { id: 't-01', name: 'Aero Dynamics', code: 'T-01', round_1: 45, round_2: 52, round_3: 48, design: 22, disqualified: false },
  { id: 't-02', name: 'Velocity X', code: 'T-02', round_1: 40, round_2: 46, round_3: 50, design: 20, disqualified: false },
  { id: 't-03', name: 'Stellar Thrust', code: 'T-03', round_1: 38, round_2: 42, round_3: 44, design: 18, disqualified: false }
];

export const MOCK_TEAMS = INITIAL_TEAMS;
export const MOCK_SCORES = [];

/**
 * Compute enriched leaderboard entries from teams + scores.
 * Accurately sums round_1, round_2, round_3, and design marks for each team.
 * Disqualified teams are sorted at the bottom.
 */
export function computeLeaderboard(teams = [], scores = []) {
  const activeTeams = (teams && teams.length > 0) ? teams : INITIAL_TEAMS;
  const scoreMap = {};

  // Aggregate all scores per team safely
  const safeScores = Array.isArray(scores) ? scores : [];
  safeScores.forEach(s => {
    if (!s || !s.team_id) return;
    if (!scoreMap[s.team_id]) {
      scoreMap[s.team_id] = { round_1: 0, round_2: 0, round_3: 0, design: 0 };
    }

    if (s.category && s.value !== undefined) {
      scoreMap[s.team_id][s.category] = Number(s.value) || 0;
    }

    if (s.round_1 !== undefined) scoreMap[s.team_id].round_1 = Number(s.round_1) || 0;
    if (s.round_2 !== undefined) scoreMap[s.team_id].round_2 = Number(s.round_2) || 0;
    if (s.round_3 !== undefined) scoreMap[s.team_id].round_3 = Number(s.round_3) || 0;
    if (s.design !== undefined) scoreMap[s.team_id].design = Number(s.design) || 0;
  });

  return activeTeams
    .map(team => {
      if (!team) return null;
      const s = scoreMap[team.id] || {};
      const round1 = s.round_1 !== undefined ? Number(s.round_1) : (Number(team.round_1) || 0);
      const round2 = s.round_2 !== undefined ? Number(s.round_2) : (Number(team.round_2) || 0);
      const round3 = s.round_3 !== undefined ? Number(s.round_3) : (Number(team.round_3) || 0);
      const design = s.design !== undefined ? Number(s.design) : (Number(team.design) || 0);

      const total = team.disqualified ? 0 : (round1 + round2 + round3 + design);

      return {
        ...team,
        round_1: round1,
        round_2: round2,
        round_3: round3,
        design,
        total,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.disqualified && !b.disqualified) return 1;
      if (!a.disqualified && b.disqualified) return -1;
      return b.total - a.total;
    })
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}

export const MOCK_LEADERBOARD = computeLeaderboard(INITIAL_TEAMS, []);
