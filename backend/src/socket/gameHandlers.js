import { getRoom, serializeRoom } from '../state/rooms.js';
import { startGame, getGame, endGame } from '../state/games.js';
import { schedulePhaseTimer, clearPhaseTimer } from '../state/phaseTimers.js';
import { resolveNight, seerCheck, littleGirlPeek, canProtectTarget, isAbilityBlocked } from '../game/nightResolver.js';
import { resolveDayVote, buildDisplayTally } from '../game/dayVote.js';
import { checkWinCondition } from '../game/winCondition.js';
import { dealCard, resolveHandOverflow, playActionCard } from '../game/cardEffects.js';
import {
  proposeCurse,
  voteCurseProposal,
  resolveSpiritPhase,
  applyQueuedCurseEffects,
} from '../game/spiritSystem.js';
import { resetNightActions, resetDayFlags, getAlivePlayers } from '../game/gameState.js';
import { NIGHT_DURATION_SEC, DAY_DURATION_SEC } from '../game/constants.js';
import { serializePublicState, serializePrivatePlayer } from '../game/serialize.js';
import { persistGameResult } from '../db/gameHistory.js';

function requireGame(socket, requiredPhase) {
  const roomId = socket.data.roomId;
  const gameState = getGame(roomId);
  if (!gameState) return { error: 'GAME_NOT_FOUND' };
  if (requiredPhase && gameState.phase !== requiredPhase) return { error: 'WRONG_PHASE' };
  return { roomId, gameState };
}

function broadcastPrivateStates(io, gameState) {
  for (const playerId of gameState.players.keys()) {
    io.to(playerId).emit('game:yourState', serializePrivatePlayer(gameState, playerId));
  }
}

function buildLiveTally(gameState) {
  const realTally = {};
  for (const targetId of gameState.dayVotes.values()) {
    if (targetId == null) continue;
    realTally[targetId] = (realTally[targetId] ?? 0) + 1;
  }
  const aliveCount = getAlivePlayers(gameState).length;
  return { tally: buildDisplayTally(gameState, realTally), majorityThreshold: Math.floor(aliveCount / 2) + 1 };
}

function broadcastWolfVoteTally(io, gameState) {
  const tally = {};
  for (const targetId of gameState.nightActions.wolfVotes.values()) {
    if (targetId == null) continue;
    tally[targetId] = (tally[targetId] ?? 0) + 1;
  }
  const wolfIds = [...gameState.players.values()].filter((p) => p.faction === 'werewolf' && p.alive).map((p) => p.id);
  for (const id of wolfIds) io.to(id).emit('night:wolfVoteUpdate', { tally });
}

function broadcastGhostState(io, gameState) {
  const ghostIds = [...gameState.players.values()].filter((p) => p.isGhost).map((p) => p.id);
  const payload = {
    spiritPool: gameState.spiritPool,
    proposals: gameState.spiritProposals.map((p) => ({
      id: p.id,
      proposerId: p.proposerId,
      cardId: p.cardId,
      targetId: p.targetId,
      voteCount: p.votes.size,
    })),
  };
  for (const id of ghostIds) io.to(id).emit('spirit:update', payload);
}

async function finalizeIfWon(room, gameState, winner) {
  if (!winner) return false;
  gameState.phase = 'ended';
  gameState.winner = winner;
  try {
    await persistGameResult(room, gameState);
  } catch (err) {
    console.error('persist game result failed:', err.message);
  }
  return true;
}

async function performResolveNight(io, roomId) {
  clearPhaseTimer(roomId);
  const room = getRoom(roomId);
  const gameState = getGame(roomId);
  if (!room || !gameState || gameState.phase !== 'night') return;

  const spiritResult = resolveSpiritPhase(gameState);
  const deadIds = resolveNight(gameState);
  const deaths = deadIds.map((playerId) => {
    const entry = [...gameState.log].reverse().find((e) => e.type === 'death' && e.playerId === playerId && e.round === gameState.round);
    return { playerId, cause: entry?.cause ?? 'unknown' };
  });
  gameState.phase = 'day';

  const cardResults = [];
  for (const player of getAlivePlayers(gameState)) {
    const dealt = dealCard(gameState, player.id);
    if (dealt) cardResults.push({ playerId: player.id, ...dealt });
  }

  const curseResults = applyQueuedCurseEffects(gameState);
  const winner = checkWinCondition(gameState);
  const ended = await finalizeIfWon(room, gameState, winner);

  if (!ended) {
    gameState.phaseEndsAt = Date.now() + DAY_DURATION_SEC * 1000;
    schedulePhaseTimer(roomId, DAY_DURATION_SEC, () => performResolveDay(io, roomId));
  }

  for (const result of curseResults) {
    if (result.cardId === 'whisper' && result.message) {
      io.to(result.targetId).emit('curse:whisperReceived', { message: result.message });
    }
  }
  const publicCurseResults = curseResults.map(({ message, ...rest }) => rest); // whisper text stays private
  io.to(roomId).emit('night:resolved', { deadIds, deaths, spiritResult, curseResults: publicCurseResults, round: gameState.round });
  for (const dealt of cardResults) {
    if (dealt.overflow) {
      gameState.players.get(dealt.playerId).pendingCardChoice = dealt.candidates;
      io.to(dealt.playerId).emit('card:overflowChoice', { candidates: dealt.candidates });
    }
  }
  broadcastPrivateStates(io, gameState);
  io.to(roomId).emit('game:update', serializePublicState(room, gameState));
}

async function performResolveDay(io, roomId) {
  clearPhaseTimer(roomId);
  const room = getRoom(roomId);
  const gameState = getGame(roomId);
  if (!room || !gameState || gameState.phase !== 'day') return;

  const voteResult = resolveDayVote(gameState);
  const winner = checkWinCondition(gameState, { eliminatedId: voteResult.eliminatedId });
  const ended = await finalizeIfWon(room, gameState, winner);

  if (!ended) {
    gameState.phase = 'night';
    gameState.round += 1;
    resetNightActions(gameState);
    resetDayFlags(gameState);
    gameState.phaseEndsAt = Date.now() + NIGHT_DURATION_SEC * 1000;
    schedulePhaseTimer(roomId, NIGHT_DURATION_SEC, () => performResolveNight(io, roomId));
  }

  io.to(roomId).emit('day:resolved', voteResult);
  broadcastPrivateStates(io, gameState);
  io.to(roomId).emit('game:update', serializePublicState(room, gameState));
}

export function registerGameHandlers(io, socket) {
  socket.on('game:start', (_payload, callback) => {
    const roomId = socket.data.roomId;
    const room = getRoom(roomId);
    if (!room) return callback?.({ ok: false, error: 'ROOM_NOT_FOUND' });
    if (room.hostId !== socket.id) return callback?.({ ok: false, error: 'NOT_HOST' });
    if (room.phase !== 'lobby') return callback?.({ ok: false, error: 'ALREADY_STARTED' });

    const playerIds = [...room.players.keys()];
    let gameState;
    try {
      gameState = startGame(roomId, playerIds, room.enabledRoles);
    } catch (err) {
      return callback?.({ ok: false, error: err.message });
    }
    room.phase = 'playing';
    schedulePhaseTimer(roomId, NIGHT_DURATION_SEC, () => performResolveNight(io, roomId));

    for (const playerId of playerIds) {
      io.to(playerId).emit('game:yourRole', serializePrivatePlayer(gameState, playerId));
    }
    io.to(roomId).emit('game:update', serializePublicState(room, gameState));
    callback?.({ ok: true });
  });

  socket.on('night:wolfVote', ({ targetId } = {}, callback) => {
    const { gameState, error } = requireGame(socket, 'night');
    if (error) return callback?.({ ok: false, error });
    const caster = gameState.players.get(socket.id);
    if (caster.faction !== 'werewolf' || !caster.alive) return callback?.({ ok: false, error: 'NOT_ALLOWED' });
    gameState.nightActions.wolfVotes.set(socket.id, targetId);
    broadcastWolfVoteTally(io, gameState);
    callback?.({ ok: true });
  });

  socket.on('night:seerCheck', ({ targetId } = {}, callback) => {
    const { gameState, error } = requireGame(socket, 'night');
    if (error) return callback?.({ ok: false, error });
    const caster = gameState.players.get(socket.id);
    if (caster.role !== 'seer' || !caster.alive) return callback?.({ ok: false, error: 'NOT_ALLOWED' });
    if (isAbilityBlocked(gameState, caster)) return callback?.({ ok: false, error: 'ABILITY_BLOCKED' });
    if (caster.lastSeerCheckRound === gameState.round) return callback?.({ ok: false, error: 'ALREADY_CHECKED_THIS_ROUND' });
    caster.lastSeerCheckRound = gameState.round;
    callback?.({ ok: true, result: seerCheck(gameState, targetId) });
  });

  socket.on('night:doctorSave', ({ targetId } = {}, callback) => {
    const { gameState, error } = requireGame(socket, 'night');
    if (error) return callback?.({ ok: false, error });
    const caster = gameState.players.get(socket.id);
    if (caster.role !== 'doctor' || !caster.alive) return callback?.({ ok: false, error: 'NOT_ALLOWED' });
    if (isAbilityBlocked(gameState, caster)) return callback?.({ ok: false, error: 'ABILITY_BLOCKED' });
    if (!canProtectTarget(gameState, 'doctor', targetId)) return callback?.({ ok: false, error: 'COOLDOWN' });
    gameState.nightActions.doctorSave = targetId;
    callback?.({ ok: true });
  });

  socket.on('night:bodyguardProtect', ({ targetId } = {}, callback) => {
    const { gameState, error } = requireGame(socket, 'night');
    if (error) return callback?.({ ok: false, error });
    const caster = gameState.players.get(socket.id);
    if (caster.role !== 'bodyguard' || !caster.alive) return callback?.({ ok: false, error: 'NOT_ALLOWED' });
    if (isAbilityBlocked(gameState, caster)) return callback?.({ ok: false, error: 'ABILITY_BLOCKED' });
    if (!canProtectTarget(gameState, 'bodyguard', targetId)) return callback?.({ ok: false, error: 'COOLDOWN' });
    gameState.nightActions.bodyguardProtect = targetId;
    callback?.({ ok: true });
  });

  socket.on('night:witchHeal', (_payload, callback) => {
    const { gameState, error } = requireGame(socket, 'night');
    if (error) return callback?.({ ok: false, error });
    const caster = gameState.players.get(socket.id);
    if (caster.role !== 'witch' || !caster.alive) return callback?.({ ok: false, error: 'NOT_ALLOWED' });
    if (isAbilityBlocked(gameState, caster)) return callback?.({ ok: false, error: 'ABILITY_BLOCKED' });
    if (caster.witchHealUsed) return callback?.({ ok: false, error: 'ALREADY_USED' });
    gameState.nightActions.witchHeal = true;
    caster.witchHealUsed = true;
    callback?.({ ok: true });
  });

  socket.on('night:witchPoison', ({ targetId } = {}, callback) => {
    const { gameState, error } = requireGame(socket, 'night');
    if (error) return callback?.({ ok: false, error });
    const caster = gameState.players.get(socket.id);
    if (caster.role !== 'witch' || !caster.alive) return callback?.({ ok: false, error: 'NOT_ALLOWED' });
    if (isAbilityBlocked(gameState, caster)) return callback?.({ ok: false, error: 'ABILITY_BLOCKED' });
    if (caster.witchPoisonUsed) return callback?.({ ok: false, error: 'ALREADY_USED' });
    gameState.nightActions.witchPoison = targetId;
    caster.witchPoisonUsed = true;
    callback?.({ ok: true });
  });

  socket.on('night:cupidLink', ({ targetId1, targetId2 } = {}, callback) => {
    const { gameState, error } = requireGame(socket, 'night');
    if (error) return callback?.({ ok: false, error });
    const caster = gameState.players.get(socket.id);
    if (caster.role !== 'cupid' || !caster.alive) return callback?.({ ok: false, error: 'NOT_ALLOWED' });
    if (isAbilityBlocked(gameState, caster)) return callback?.({ ok: false, error: 'ABILITY_BLOCKED' });
    if (gameState.round !== 1) return callback?.({ ok: false, error: 'ONLY_NIGHT_1' });
    gameState.nightActions.cupidLink = [targetId1, targetId2];
    callback?.({ ok: true });
  });

  socket.on('night:hunterRevengeTarget', ({ targetId } = {}, callback) => {
    const { gameState, error } = requireGame(socket);
    if (error) return callback?.({ ok: false, error });
    const caster = gameState.players.get(socket.id);
    if (caster.role !== 'hunter' || !caster.alive) return callback?.({ ok: false, error: 'NOT_ALLOWED' });
    caster.hunterRevengeTarget = targetId;
    callback?.({ ok: true });
  });

  socket.on('night:littleGirlPeek', (_payload, callback) => {
    const { gameState, error } = requireGame(socket, 'night');
    if (error) return callback?.({ ok: false, error });
    const caster = gameState.players.get(socket.id);
    if (caster.role !== 'little_girl' || !caster.alive) return callback?.({ ok: false, error: 'NOT_ALLOWED' });
    callback?.({ ok: true, target: littleGirlPeek(gameState) });
  });

  socket.on('card:play', (payload = {}, callback) => {
    const { gameState, roomId, error } = requireGame(socket);
    if (error) return callback?.({ ok: false, error });
    try {
      const result = playActionCard(gameState, socket.id, payload.cardId, payload);
      if (payload.cardId === 'reveal_role') {
        io.to(roomId).emit('card:roleRevealed', result);
      }
      broadcastPrivateStates(io, gameState);
      callback?.({ ok: true, result });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('card:resolveOverflow', ({ keepCardIds } = {}, callback) => {
    const { gameState, error } = requireGame(socket);
    if (error) return callback?.({ ok: false, error });
    try {
      resolveHandOverflow(gameState, socket.id, keepCardIds);
      callback?.({ ok: true });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('spirit:propose', ({ cardId, targetId, message } = {}, callback) => {
    const { gameState, error } = requireGame(socket, 'night');
    if (error) return callback?.({ ok: false, error });
    try {
      const proposal = proposeCurse(gameState, socket.id, cardId, targetId, message);
      broadcastGhostState(io, gameState);
      callback?.({ ok: true, proposalId: proposal.id });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('spirit:vote', ({ proposalId } = {}, callback) => {
    const { gameState, error } = requireGame(socket, 'night');
    if (error) return callback?.({ ok: false, error });
    try {
      voteCurseProposal(gameState, socket.id, proposalId);
      broadcastGhostState(io, gameState);
      callback?.({ ok: true });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('day:vote', ({ targetId } = {}, callback) => {
    const { gameState, roomId, error } = requireGame(socket, 'day');
    if (error) return callback?.({ ok: false, error });
    const voter = gameState.players.get(socket.id);
    if (!voter?.alive) return callback?.({ ok: false, error: 'NOT_ALLOWED' });
    gameState.dayVotes.set(socket.id, targetId ?? null);
    io.to(roomId).emit('day:voteUpdate', buildLiveTally(gameState));
    callback?.({ ok: true });
  });

  socket.on('game:resolveNight', async (_payload, callback) => {
    const roomId = socket.data.roomId;
    const room = getRoom(roomId);
    const gameState = getGame(roomId);
    if (!room || !gameState) return callback?.({ ok: false, error: 'GAME_NOT_FOUND' });
    if (room.hostId !== socket.id) return callback?.({ ok: false, error: 'NOT_HOST' });
    if (gameState.phase !== 'night') return callback?.({ ok: false, error: 'WRONG_PHASE' });

    await performResolveNight(io, roomId);
    callback?.({ ok: true });
  });

  socket.on('game:resolveDay', async (_payload, callback) => {
    const roomId = socket.data.roomId;
    const room = getRoom(roomId);
    const gameState = getGame(roomId);
    if (!room || !gameState) return callback?.({ ok: false, error: 'GAME_NOT_FOUND' });
    if (room.hostId !== socket.id) return callback?.({ ok: false, error: 'NOT_HOST' });
    if (gameState.phase !== 'day') return callback?.({ ok: false, error: 'WRONG_PHASE' });

    await performResolveDay(io, roomId);
    callback?.({ ok: true });
  });

  socket.on('game:backToRoom', (_payload, callback) => {
    const roomId = socket.data.roomId;
    const room = getRoom(roomId);
    const gameState = getGame(roomId);
    if (!room) return callback?.({ ok: false, error: 'ROOM_NOT_FOUND' });
    if (room.hostId !== socket.id) return callback?.({ ok: false, error: 'NOT_HOST' });
    if (!gameState || gameState.phase !== 'ended') return callback?.({ ok: false, error: 'GAME_NOT_ENDED' });

    clearPhaseTimer(roomId);
    endGame(roomId);
    room.phase = 'lobby';
    io.to(roomId).emit('room:update', serializeRoom(room));
    callback?.({ ok: true });
  });
}
