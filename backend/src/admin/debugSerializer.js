import { listAllRooms, getRoom } from '../state/rooms.js';
import { getGame } from '../state/games.js';

export function listRoomSummaries() {
  return listAllRooms().map((room) => {
    const gameState = getGame(room.id);
    return {
      id: room.id,
      lobbyPhase: room.phase,
      hostId: room.hostId,
      playerCount: room.players.size,
      players: [...room.players.values()].map((p) => ({ id: p.id, name: p.name, isHost: p.isHost })),
      game: gameState
        ? {
            phase: gameState.phase,
            round: gameState.round,
            spiritPool: gameState.spiritPool,
            winner: gameState.winner,
          }
        : null,
    };
  });
}

// Full, unredacted snapshot — admin-only. Never send this to a regular
// player socket (it contains every role, hand, and secret status flag).
export function getRoomAndGame(roomId) {
  const room = getRoom(roomId);
  if (!room) return null;
  const gameState = getGame(roomId);

  return {
    room: {
      id: room.id,
      phase: room.phase,
      hostId: room.hostId,
      players: [...room.players.values()],
    },
    game: gameState ? serializeFullGameState(gameState) : null,
  };
}

function serializeFullGameState(gameState) {
  return {
    phase: gameState.phase,
    round: gameState.round,
    phaseEndsAt: gameState.phaseEndsAt,
    totalPlayers: gameState.totalPlayers,
    spiritPool: gameState.spiritPool,
    legendaryConsumed: gameState.legendaryConsumed,
    usedOncePerGame: gameState.usedOncePerGame,
    lovers: gameState.lovers,
    winner: gameState.winner,
    aoeVoteHiddenThisRound: gameState.aoeVoteHiddenThisRound,
    aoeVoteBlockedThisRound: gameState.aoeVoteBlockedThisRound,
    aoeFakeVotes: gameState.aoeFakeVotes ? Object.fromEntries(gameState.aoeFakeVotes) : null,
    players: [...gameState.players.values()].map((p) => ({
      ...p,
      status: { ...p.status },
    })),
    nightActions: {
      ...gameState.nightActions,
      wolfVotes: Object.fromEntries(gameState.nightActions.wolfVotes),
    },
    dayVotes: Object.fromEntries(gameState.dayVotes),
    spiritProposals: gameState.spiritProposals.map((p) => ({ ...p, votes: [...p.votes] })),
    queuedCurseEffects: gameState.queuedCurseEffects,
    log: gameState.log.slice(-100),
  };
}
