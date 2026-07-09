import { CURSE_CARDS, curseCost } from './curseCards.js';
import { killPlayer } from './gameState.js';
import { resolveDeathConsequences, checkWolfCubTrigger } from './nightResolver.js';

export function proposeCurse(gameState, proposerId, cardId, targetId) {
  const proposer = gameState.players.get(proposerId);
  if (!proposer?.isGhost) throw new Error('NOT_A_GHOST');
  if (!CURSE_CARDS[cardId]) throw new Error('UNKNOWN_CURSE_CARD');

  const proposal = {
    id: `${gameState.round}-${gameState.spiritProposals.length}`,
    proposerId,
    cardId,
    targetId,
    votes: new Set([proposerId]),
  };
  gameState.spiritProposals.push(proposal);
  return proposal;
}

export function voteCurseProposal(gameState, voterId, proposalId) {
  const voter = gameState.players.get(voterId);
  if (!voter?.isGhost) throw new Error('NOT_A_GHOST');

  for (const p of gameState.spiritProposals) p.votes.delete(voterId);

  const proposal = gameState.spiritProposals.find((p) => p.id === proposalId);
  if (!proposal) throw new Error('PROPOSAL_NOT_FOUND');
  proposal.votes.add(voterId);
  return proposal;
}

// Must run BEFORE resolveNight() each round — spirit votes spend the pool
// as it stood before this round's deaths are tallied in.
export function resolveSpiritPhase(gameState) {
  const proposals = gameState.spiritProposals;
  gameState.spiritProposals = [];

  if (proposals.length === 0) return { resolved: false, reason: 'NO_PROPOSALS' };

  let winner = null;
  let maxVotes = 0;
  let tie = false;
  for (const p of proposals) {
    const count = p.votes.size;
    if (count > maxVotes) {
      winner = p;
      maxVotes = count;
      tie = false;
    } else if (count === maxVotes) {
      tie = true;
    }
  }

  if (!winner || tie) return { resolved: false, reason: 'TIE' };

  const card = CURSE_CARDS[winner.cardId];
  if (card.limit === 'once_per_game' && gameState.usedOncePerGame[winner.cardId]) {
    return { resolved: false, reason: 'ALREADY_USED' };
  }

  const cost = curseCost(winner.cardId, gameState.totalPlayers);
  if (gameState.spiritPool < cost) {
    return { resolved: false, reason: 'INSUFFICIENT_POOL', cost };
  }

  gameState.spiritPool -= cost;
  if (card.limit === 'once_per_game') gameState.usedOncePerGame[winner.cardId] = true;

  gameState.queuedCurseEffects.push({
    cardId: winner.cardId,
    targetId: winner.targetId,
    proposerId: winner.proposerId,
    round: gameState.round,
  });
  gameState.log.push({
    round: gameState.round,
    type: 'curse_queued',
    cardId: winner.cardId,
    targetId: winner.targetId,
    proposerId: winner.proposerId,
  });

  return { resolved: true, cardId: winner.cardId, targetId: winner.targetId, cost };
}

function applyCurseEffect(gameState, effect) {
  const { cardId, targetId } = effect;
  const round = gameState.round;

  switch (cardId) {
    case 'whisper':
      return { cardId, targetId, note: 'fake_clue_sent' };

    case 'silence': {
      const target = gameState.players.get(targetId);
      if (target) target.status.silencedUntilRound = round;
      return { cardId, targetId };
    }

    case 'reveal_role': {
      const target = gameState.players.get(targetId);
      return { cardId, targetId, role: target?.role ?? null };
    }

    case 'nightmare': {
      const target = gameState.players.get(targetId);
      if (target) target.status.voteBlockedUntilRound = round;
      return { cardId, targetId };
    }

    case 'chill':
      gameState.aoeVoteHiddenThisRound = true;
      return { cardId };

    case 'weaken': {
      const target = gameState.players.get(targetId);
      if (target) target.status.abilityBlockedUntilRound = round + 1;
      return { cardId, targetId };
    }

    case 'false_accusation': {
      const fakeMap = new Map();
      for (const p of gameState.players.values()) {
        if (p.alive) fakeMap.set(p.id, targetId);
      }
      gameState.aoeFakeVotes = fakeMap;
      return { cardId };
    }

    case 'mark_of_death': {
      const target = gameState.players.get(targetId);
      if (target) target.status.markedForDeathAtRound = round + 1;
      return { cardId, targetId };
    }

    case 'curse_of_silence_council':
      gameState.aoeVoteBlockedThisRound = true;
      return { cardId };

    case 'soul_reap': {
      const chained = killPlayer(gameState, targetId, 'soul_reap');
      const initial = [targetId, ...chained];
      checkWolfCubTrigger(gameState, initial);
      const allDead = resolveDeathConsequences(gameState, initial);
      checkWolfCubTrigger(gameState, allDead);
      return { cardId, targetId, allDead };
    }

    default:
      return { cardId, targetId };
  }
}

// Called at the start of Day, applying whatever the previous night's
// spirit vote queued.
export function applyQueuedCurseEffects(gameState) {
  const effects = gameState.queuedCurseEffects;
  gameState.queuedCurseEffects = [];
  return effects.map((effect) => applyCurseEffect(gameState, effect));
}
