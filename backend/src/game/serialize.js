export function serializePublicState(room, gameState) {
  return {
    phase: gameState.phase,
    round: gameState.round,
    phaseEndsAt: gameState.phaseEndsAt,
    spiritPool: gameState.spiritPool,
    winner: gameState.winner,
    players: [...gameState.players.values()].map((p) => ({
      id: p.id,
      name: room.players.get(p.id)?.name ?? 'unknown',
      alive: p.alive,
      isGhost: p.isGhost,
    })),
  };
}

export function serializePrivatePlayer(gameState, playerId) {
  const p = gameState.players.get(playerId);
  if (!p) return null;

  const deadTeammates = [...gameState.players.values()]
    .filter((other) => !other.alive && other.faction === p.faction && other.id !== p.id)
    .map((other) => ({ id: other.id, role: other.role }));

  return {
    id: p.id,
    role: p.role,
    faction: p.faction,
    alive: p.alive,
    isGhost: p.isGhost,
    cards: [...p.cards],
    pendingCardChoice: p.pendingCardChoice,
    hunterRevengeTarget: p.hunterRevengeTarget,
    loverId: p.loverId,
    deadTeammates,
    witchHealUsed: p.witchHealUsed,
    witchPoisonUsed: p.witchPoisonUsed,
    lastProtectedTarget: p.lastProtectedTarget,
    lastGuardedTarget: p.lastGuardedTarget,
    hasCheckedThisRound: p.lastSeerCheckRound === gameState.round,
  };
}
