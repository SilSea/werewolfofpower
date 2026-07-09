import { ACTION_CARDS, HAND_LIMIT, drawActionCard } from './actionCards.js';

export function dealCard(gameState, playerId) {
  const player = gameState.players.get(playerId);
  if (!player || !player.alive) return null;
  if (player.pendingCardChoice) return null; // still deciding a previous overflow — don't stack another

  const cardId = drawActionCard(gameState.round, gameState.legendaryConsumed);
  if (ACTION_CARDS[cardId].rarity === 'legendary') gameState.legendaryConsumed = true;

  if (player.cards.length < HAND_LIMIT) {
    player.cards.push(cardId);
    return { cardId, overflow: false };
  }

  return { cardId, overflow: true, candidates: [...player.cards, cardId] };
}

export function resolveHandOverflow(gameState, playerId, keepCardIds) {
  const player = gameState.players.get(playerId);
  if (!player) throw new Error('PLAYER_NOT_FOUND');
  if (!player.pendingCardChoice) throw new Error('NO_PENDING_CHOICE');
  if (keepCardIds.length !== HAND_LIMIT) throw new Error('MUST_KEEP_EXACTLY_HAND_LIMIT');

  const pool = [...player.pendingCardChoice];
  for (const cardId of keepCardIds) {
    const idx = pool.indexOf(cardId);
    if (idx === -1) throw new Error('INVALID_CARD_SELECTION');
    pool.splice(idx, 1);
  }

  player.cards = keepCardIds;
  player.pendingCardChoice = null;
}

function removeCardFromHand(player, cardId) {
  const idx = player.cards.indexOf(cardId);
  if (idx !== -1) player.cards.splice(idx, 1);
}

const PHASE_MATCH = {
  any: () => true,
  day: (gs) => gs.phase === 'day',
  day_vote: (gs) => gs.phase === 'day',
  night: (gs) => gs.phase === 'night',
  any_after_round_3: (gs) => gs.round >= 3,
};

const OFFENSIVE_CARDS = new Set(['silence', 'block_vote', 'reveal_role', 'redirect_vote']);

// Mirror Shield sits in the target's hand; if present when an offensive
// card lands on them, it reflects the effect onto the original caster
// and is consumed.
function resolveActualTarget(gameState, casterId, targetId, cardId) {
  if (!OFFENSIVE_CARDS.has(cardId)) return targetId;
  const target = gameState.players.get(targetId);
  if (target?.cards.includes('mirror_shield')) {
    removeCardFromHand(target, 'mirror_shield');
    return casterId;
  }
  return targetId;
}

function applyEffect(gameState, caster, cardId, options) {
  const round = gameState.round;

  switch (cardId) {
    case 'peek_card': {
      const target = gameState.players.get(options.targetId);
      return { cards: target ? [...target.cards] : [] };
    }
    case 'track': {
      const target = gameState.players.get(options.targetId);
      if (!target) return { target: null };
      const { nightActions } = gameState;
      if (target.role === 'doctor') return { target: nightActions.doctorSave ?? null };
      if (target.role === 'bodyguard') return { target: nightActions.bodyguardProtect ?? null };
      if (target.faction === 'werewolf') return { target: nightActions.wolfVotes.get(target.id) ?? null };
      return { target: null };
    }
    case 'silence': {
      const actualId = resolveActualTarget(gameState, caster.id, options.targetId, cardId);
      const actual = gameState.players.get(actualId);
      actual.status.silencedUntilRound = round;
      return { silencedId: actualId };
    }
    case 'block_vote': {
      const actualId = resolveActualTarget(gameState, caster.id, options.targetId, cardId);
      const actual = gameState.players.get(actualId);
      actual.status.voteBlockedUntilRound = round;
      return { blockedId: actualId };
    }
    case 'reveal_role': {
      const actualId = resolveActualTarget(gameState, caster.id, options.targetId, cardId);
      const actual = gameState.players.get(actualId);
      return { revealedId: actualId, role: actual.role };
    }
    case 'redirect_vote': {
      const actualId = resolveActualTarget(gameState, caster.id, options.targetId, cardId);
      const actual = gameState.players.get(actualId);
      actual.status.redirectVoteTo = options.redirectToId;
      return { redirectedId: actualId, redirectToId: options.redirectToId };
    }
    case 'double_vote': {
      caster.status.doubleVoteActive = true;
      return { casterId: caster.id };
    }
    case 'inherit_role': {
      const deadTeammate = gameState.players.get(options.deadTeammateId);
      if (!deadTeammate) throw new Error('TARGET_NOT_FOUND');
      if (deadTeammate.alive) throw new Error('TARGET_STILL_ALIVE');
      if (deadTeammate.faction !== caster.faction) throw new Error('DIFFERENT_FACTION');
      caster.role = deadTeammate.role;
      return { newRole: deadTeammate.role };
    }
    default:
      throw new Error('UNKNOWN_CARD');
  }
}

export function playActionCard(gameState, casterId, cardId, options = {}) {
  const caster = gameState.players.get(casterId);
  if (!caster || !caster.alive) throw new Error('INVALID_CASTER');
  if (!caster.cards.includes(cardId)) throw new Error('CARD_NOT_IN_HAND');

  const card = ACTION_CARDS[cardId];
  if (!card) throw new Error('UNKNOWN_CARD');
  if (card.category === 'defensive') throw new Error('PASSIVE_CARD_CANNOT_BE_PLAYED');
  if (!PHASE_MATCH[card.usableWhen](gameState)) throw new Error('WRONG_PHASE');

  const result = applyEffect(gameState, caster, cardId, options);
  removeCardFromHand(caster, cardId);
  gameState.log.push({ round: gameState.round, type: 'card_played', playerId: casterId, cardId });
  return result;
}
