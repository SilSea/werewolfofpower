export const ROLES = {
  werewolf: { faction: 'werewolf', trigger: 'night' },
  wolf_cub: { faction: 'werewolf', trigger: 'passive' },
  villager: { faction: 'village', trigger: 'none' },
  seer: { faction: 'village', trigger: 'night' },
  doctor: { faction: 'village', trigger: 'night' },
  witch: { faction: 'village', trigger: 'night' },
  hunter: { faction: 'village', trigger: 'on_death' },
  bodyguard: { faction: 'village', trigger: 'night' },
  cupid: { faction: 'village', trigger: 'night_1_only' },
  little_girl: { faction: 'village', trigger: 'night_odd' },
  tanner: { faction: 'neutral', trigger: 'none' },
};

export function factionOf(roleId) {
  return ROLES[roleId]?.faction ?? null;
}

function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Scaling: ~1 wolf per 4 players, special village roles unlock at player-count
// thresholds, Wolf Cub swaps in for one werewolf slot at 8+, Tanner at 8+.
export function assignRoles(playerIds) {
  const N = playerIds.length;
  if (N < 5) throw new Error('MIN_PLAYERS_NOT_MET');

  const roleList = [];
  const wolfCount = Math.max(1, Math.floor(N / 4));

  for (let i = 0; i < wolfCount; i++) roleList.push('werewolf');
  if (wolfCount >= 2 && N >= 8) {
    roleList[roleList.length - 1] = 'wolf_cub';
  }

  roleList.push('seer', 'doctor', 'hunter', 'bodyguard');
  if (N >= 6) roleList.push('witch');
  if (N >= 6) roleList.push('little_girl');
  if (N >= 7) roleList.push('cupid');
  if (N >= 8) roleList.push('tanner');

  while (roleList.length < N) roleList.push('villager');
  if (roleList.length > N) roleList.length = N;

  const shuffledRoles = shuffle(roleList);
  const shuffledPlayers = shuffle(playerIds);

  const assignment = new Map();
  shuffledPlayers.forEach((playerId, i) => {
    assignment.set(playerId, shuffledRoles[i]);
  });
  return assignment;
}
