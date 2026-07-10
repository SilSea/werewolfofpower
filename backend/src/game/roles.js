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

// Roles the host can individually toggle on/off before starting. Werewolf
// and Villager are always the base and aren't part of this list. Wolf Cub
// doesn't add a headcount slot — it substitutes one werewolf, so it's kept
// out of OPTIONAL_SINGLE_ROLES and handled separately below.
export const OPTIONAL_SINGLE_ROLES = ['seer', 'doctor', 'witch', 'hunter', 'bodyguard', 'cupid', 'little_girl', 'tanner'];
export const TOGGLEABLE_ROLES = [...OPTIONAL_SINGLE_ROLES, 'wolf_cub'];

// These 4 fit any lobby down to the 5-player minimum (1 wolf + 4 = 5).
// Witch/Cupid/Little Girl/Tanner/Wolf Cub default off so a fresh room
// never opens with an unstartable role count — host opts them in once
// they know their headcount.
export const DEFAULT_ENABLED_ROLES = ['seer', 'doctor', 'hunter', 'bodyguard'];

// Scaling: ~1 wolf per 4 players (min 1). Each enabled optional role adds
// exactly one slot; remaining slots fill with Villager. Throws if the host
// enabled more roles than there are players to fill them.
export function assignRoles(playerIds, enabledRoles = DEFAULT_ENABLED_ROLES) {
  const N = playerIds.length;
  if (N < 5) throw new Error('MIN_PLAYERS_NOT_MET');

  const roleList = [];
  const wolfCount = Math.max(1, Math.floor(N / 4));

  for (let i = 0; i < wolfCount; i++) roleList.push('werewolf');
  if (enabledRoles.includes('wolf_cub') && wolfCount >= 2 && N >= 8) {
    roleList[roleList.length - 1] = 'wolf_cub';
  }

  for (const role of OPTIONAL_SINGLE_ROLES) {
    if (enabledRoles.includes(role)) roleList.push(role);
  }

  if (roleList.length > N) throw new Error('TOO_MANY_ROLES_FOR_PLAYER_COUNT');

  while (roleList.length < N) roleList.push('villager');

  const shuffledRoles = shuffle(roleList);
  const shuffledPlayers = shuffle(playerIds);

  const assignment = new Map();
  shuffledPlayers.forEach((playerId, i) => {
    assignment.set(playerId, shuffledRoles[i]);
  });
  return assignment;
}
