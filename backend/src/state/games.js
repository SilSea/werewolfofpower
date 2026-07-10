import { createGameState } from '../game/gameState.js';

const games = new Map();

export function startGame(roomId, playerIds, enabledRoles) {
  const gameState = createGameState(playerIds, enabledRoles);
  games.set(roomId, gameState);
  return gameState;
}

export function getGame(roomId) {
  return games.get(roomId);
}

export function endGame(roomId) {
  games.delete(roomId);
}
