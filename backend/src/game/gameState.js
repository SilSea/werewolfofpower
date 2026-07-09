import { assignRoles, factionOf } from './roles.js';
import { NIGHT_DURATION_SEC } from './constants.js';

function emptyNightActions() {
  return {
    wolfVotes: new Map(), // wolfId -> targetId
    doctorSave: null,
    witchHeal: false,
    witchPoison: null,
    bodyguardProtect: null,
    cupidLink: null, // [id1, id2], round 1 only
  };
}

export function createGameState(playerIds) {
  const roleAssignment = assignRoles(playerIds);
  const players = new Map();

  for (const id of playerIds) {
    const role = roleAssignment.get(id);
    players.set(id, {
      id,
      role,
      startingRole: role,
      faction: factionOf(role),
      alive: true,
      isGhost: false,
      cards: [],
      pendingCardChoice: null, // set when a dealt card overflows the hand limit
      loverId: null,
      hunterRevengeTarget: null,
      lastProtectedTarget: null, // doctor cooldown
      lastGuardedTarget: null, // bodyguard cooldown
      lastSeerCheckRound: 0, // seer: 1 check per night
      witchHealUsed: false,
      witchPoisonUsed: false,
      status: {
        silencedUntilRound: 0,
        voteBlockedUntilRound: 0,
        redirectVoteTo: null,
        doubleVoteActive: false,
        abilityBlockedUntilRound: 0,
        markedForDeathAtRound: 0,
      },
    });
  }

  return {
    phase: 'night',
    round: 1,
    phaseEndsAt: Date.now() + NIGHT_DURATION_SEC * 1000,
    totalPlayers: playerIds.length,
    players,
    nightActions: emptyNightActions(),
    dayVotes: new Map(), // playerId -> targetId|null(skip)
    spiritPool: 0,
    spiritProposals: [],
    usedOncePerGame: { false_accusation: false, curse_of_silence_council: false, soul_reap: false },
    legendaryConsumed: false,
    queuedCurseEffects: [],
    aoeVoteHiddenThisRound: false,
    aoeVoteBlockedThisRound: false,
    aoeFakeVotes: null, // Map playerId -> fakeTargetId, set by False Accusation
    lovers: null, // [id1, id2]
    winner: null, // { faction, playerIds }
    log: [],
  };
}

export function resetNightActions(gameState) {
  gameState.nightActions = emptyNightActions();
}

export function resetDayFlags(gameState) {
  gameState.dayVotes = new Map();
  gameState.aoeVoteHiddenThisRound = false;
  gameState.aoeVoteBlockedThisRound = false;
  gameState.aoeFakeVotes = null;

  // doubleVoteActive/redirectVoteTo only clear inside the vote-tally loop
  // when the player actually casts a vote — if they never vote that day
  // (disconnect, forgot, timer expiry) the flag would otherwise leak into
  // a future round. Force-clear here regardless.
  for (const player of gameState.players.values()) {
    player.status.doubleVoteActive = false;
    player.status.redirectVoteTo = null;
  }
}

export function getAlivePlayers(gameState) {
  return [...gameState.players.values()].filter((p) => p.alive);
}

export function getGhosts(gameState) {
  return [...gameState.players.values()].filter((p) => p.isGhost);
}

export function getPlayersByFaction(gameState, faction) {
  return getAlivePlayers(gameState).filter((p) => p.faction === faction);
}

// Returns ids of players who died as a result (excludes playerId itself),
// including any lover chain-reaction deaths. Empty array if nobody died
// (already dead, or saved by Extra Life).
export function killPlayer(gameState, playerId, cause) {
  const player = gameState.players.get(playerId);
  if (!player || !player.alive) return [];

  const extraLifeIdx = player.cards.indexOf('extra_life');
  if (extraLifeIdx !== -1) {
    player.cards.splice(extraLifeIdx, 1);
    gameState.log.push({ round: gameState.round, type: 'extra_life_consumed', playerId });
    return [];
  }

  player.alive = false;
  player.isGhost = true;
  gameState.spiritPool += 1;
  gameState.log.push({ round: gameState.round, type: 'death', playerId, cause });

  const chained = [];

  if (player.loverId) {
    const lover = gameState.players.get(player.loverId);
    if (lover?.alive) {
      chained.push(player.loverId, ...killPlayer(gameState, player.loverId, 'lover_heartbreak'));
    }
  }

  return chained;
}
