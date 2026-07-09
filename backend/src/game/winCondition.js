import { getAlivePlayers } from './gameState.js';

// Tanner wins alone, immediately, only if voted out by day vote.
function checkTannerWin(gameState, eliminatedId) {
  if (!eliminatedId) return null;
  const player = gameState.players.get(eliminatedId);
  if (player?.role === 'tanner') return { faction: 'tanner', playerIds: [eliminatedId] };
  return null;
}

// Lovers win together, overriding faction outcome, if they are the last two standing.
function checkLoversWin(gameState) {
  if (!gameState.lovers) return null;
  const alive = getAlivePlayers(gameState);
  if (alive.length !== 2) return null;

  const aliveIds = alive.map((p) => p.id).sort();
  const loverIds = [...gameState.lovers].sort();
  if (aliveIds[0] === loverIds[0] && aliveIds[1] === loverIds[1]) {
    return { faction: 'lovers', playerIds: loverIds };
  }
  return null;
}

function checkFactionWin(gameState) {
  const alive = getAlivePlayers(gameState);
  const wolves = alive.filter((p) => p.faction === 'werewolf');
  const villagers = alive.filter((p) => p.faction === 'village');

  if (wolves.length === 0) {
    return { faction: 'village', playerIds: villagers.map((p) => p.id) };
  }
  if (wolves.length >= villagers.length) {
    return { faction: 'werewolf', playerIds: wolves.map((p) => p.id) };
  }
  return null;
}

export function checkWinCondition(gameState, { eliminatedId } = {}) {
  const tannerWin = checkTannerWin(gameState, eliminatedId);
  if (tannerWin) return tannerWin;

  const loversWin = checkLoversWin(gameState);
  if (loversWin) return loversWin;

  return checkFactionWin(gameState);
}
