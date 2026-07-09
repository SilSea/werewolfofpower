import { killPlayer, getAlivePlayers } from './gameState.js';
import { resolveDeathConsequences, checkWolfCubTrigger } from './nightResolver.js';

// Chill hides the real tally; False Accusation replaces it with a fake
// one. Both only affect what's DISPLAYED — the real tally (passed in)
// always drives the actual elimination.
export function buildDisplayTally(gameState, realTally) {
  if (gameState.aoeFakeVotes) {
    const fake = {};
    for (const targetId of gameState.aoeFakeVotes.values()) {
      fake[targetId] = (fake[targetId] ?? 0) + 1;
    }
    return fake;
  }
  if (gameState.aoeVoteHiddenThisRound) return {};
  return realTally;
}

export function resolveDayVote(gameState) {
  if (gameState.aoeVoteBlockedThisRound) {
    return { eliminatedId: null, tally: {}, allDead: [], blocked: true };
  }

  const { round } = gameState;
  const tally = new Map();

  for (const [voterId, targetId] of gameState.dayVotes) {
    const voter = gameState.players.get(voterId);
    if (!voter?.alive) continue;
    if (voter.status.voteBlockedUntilRound >= round) continue;

    // Redirect applies even if the voter chose Skip — the whole point is
    // their vote (whatever it was) silently becomes the redirected target.
    const effectiveTarget = voter.status.redirectVoteTo ?? targetId;
    if (effectiveTarget == null) continue;

    const weight = voter.status.doubleVoteActive ? 2 : 1;
    tally.set(effectiveTarget, (tally.get(effectiveTarget) || 0) + weight);

    voter.status.doubleVoteActive = false;
    voter.status.redirectVoteTo = null;
  }

  let maxVotes = 0;
  let topIds = [];
  for (const [id, count] of tally) {
    if (count > maxVotes) {
      maxVotes = count;
      topIds = [id];
    } else if (count === maxVotes) {
      topIds.push(id);
    }
  }

  // Needs a strict majority of alive players (> half), not just plurality.
  const aliveCount = getAlivePlayers(gameState).length;
  const majorityThreshold = Math.floor(aliveCount / 2) + 1;
  const eliminatedId = topIds.length === 1 && maxVotes >= majorityThreshold ? topIds[0] : null;
  let allDead = [];

  if (eliminatedId) {
    const chained = killPlayer(gameState, eliminatedId, 'day_vote');
    const initial = [eliminatedId, ...chained];
    checkWolfCubTrigger(gameState, initial);
    allDead = resolveDeathConsequences(gameState, initial);
    checkWolfCubTrigger(gameState, allDead);
  }

  return {
    eliminatedId,
    tally: buildDisplayTally(gameState, Object.fromEntries(tally)),
    allDead,
    blocked: false,
    majorityThreshold,
  };
}
