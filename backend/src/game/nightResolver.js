import { getAlivePlayers, killPlayer } from './gameState.js';

function majorityTarget(votesMap) {
  if (votesMap.size === 0) return null;

  const tally = new Map();
  for (const targetId of votesMap.values()) {
    tally.set(targetId, (tally.get(targetId) || 0) + 1);
  }

  let best = null;
  let bestCount = -1;
  let tie = false;
  for (const [targetId, count] of tally) {
    if (count > bestCount) {
      best = targetId;
      bestCount = count;
      tie = false;
    } else if (count === bestCount) {
      tie = true;
    }
  }

  return tie ? null : best;
}

// Chains Hunter revenge kills until no further deaths trigger one.
// Returns every player id who died as part of this resolution pass.
export function resolveDeathConsequences(gameState, initialDeadIds) {
  const allDead = new Set(initialDeadIds);
  const queue = [...initialDeadIds];

  while (queue.length > 0) {
    const deadId = queue.shift();
    const player = gameState.players.get(deadId);
    if (!player) continue;

    if (player.role === 'hunter' && player.hunterRevengeTarget) {
      const target = gameState.players.get(player.hunterRevengeTarget);
      if (target?.alive) {
        const chained = killPlayer(gameState, target.id, 'hunter_revenge');
        for (const id of [target.id, ...chained]) {
          if (!allDead.has(id)) {
            allDead.add(id);
            queue.push(id);
          }
        }
      }
    }
  }

  return [...allDead];
}

export function checkWolfCubTrigger(gameState, deadIds) {
  const triggered = deadIds.some((id) => gameState.players.get(id)?.role === 'wolf_cub');
  if (triggered) gameState.wolfCubBonusNextNight = true;
}

export function isAbilityBlocked(gameState, player) {
  return player.status.abilityBlockedUntilRound >= gameState.round;
}

export function canProtectTarget(gameState, protectorRole, targetId) {
  const protector = [...gameState.players.values()].find((p) => p.role === protectorRole && p.alive);
  if (!protector) return false;
  const lastTarget = protectorRole === 'doctor' ? protector.lastProtectedTarget : protector.lastGuardedTarget;
  return lastTarget !== targetId;
}

export function resolveNight(gameState) {
  const { nightActions, round } = gameState;
  const deadThisNight = [];

  if (round === 1 && nightActions.cupidLink) {
    const [a, b] = nightActions.cupidLink;
    const pa = gameState.players.get(a);
    const pb = gameState.players.get(b);
    if (pa && pb) {
      pa.loverId = b;
      pb.loverId = a;
      gameState.lovers = [a, b];
    }
  }

  const protectedIds = new Set();
  if (nightActions.doctorSave) protectedIds.add(nightActions.doctorSave);
  if (nightActions.bodyguardProtect) protectedIds.add(nightActions.bodyguardProtect);

  const wolfTarget = majorityTarget(nightActions.wolfVotes);
  const witchCancelsWolf = nightActions.witchHeal && wolfTarget != null;

  if (wolfTarget && !protectedIds.has(wolfTarget) && !witchCancelsWolf) {
    const chained = killPlayer(gameState, wolfTarget, 'wolf_kill');
    deadThisNight.push(wolfTarget, ...chained);
  }

  if (gameState.wolfCubBonusNextNight) {
    gameState.wolfCubBonusNextNight = false;
    const bonusPool = getAlivePlayers(gameState).filter(
      (p) => p.faction !== 'werewolf' && p.id !== wolfTarget
    );
    if (bonusPool.length > 0) {
      const bonusTarget = bonusPool[Math.floor(Math.random() * bonusPool.length)];
      if (!protectedIds.has(bonusTarget.id)) {
        const chained = killPlayer(gameState, bonusTarget.id, 'wolf_kill_bonus');
        deadThisNight.push(bonusTarget.id, ...chained);
      }
    }
  }

  if (nightActions.witchPoison) {
    const chained = killPlayer(gameState, nightActions.witchPoison, 'witch_poison');
    deadThisNight.push(nightActions.witchPoison, ...chained);
  }

  for (const player of gameState.players.values()) {
    if (player.alive && player.status.markedForDeathAtRound === round) {
      if (!protectedIds.has(player.id)) {
        const chained = killPlayer(gameState, player.id, 'mark_of_death');
        deadThisNight.push(player.id, ...chained);
      }
      player.status.markedForDeathAtRound = 0;
    }
  }

  const doctor = [...gameState.players.values()].find((p) => p.role === 'doctor');
  if (doctor && nightActions.doctorSave) doctor.lastProtectedTarget = nightActions.doctorSave;

  const bodyguard = [...gameState.players.values()].find((p) => p.role === 'bodyguard');
  if (bodyguard && nightActions.bodyguardProtect) bodyguard.lastGuardedTarget = nightActions.bodyguardProtect;

  checkWolfCubTrigger(gameState, deadThisNight);
  const allDead = resolveDeathConsequences(gameState, deadThisNight);
  checkWolfCubTrigger(gameState, allDead);

  return allDead;
}

export function seerCheck(gameState, targetId) {
  const target = gameState.players.get(targetId);
  if (!target) return null;
  return target.faction === 'werewolf' ? 'werewolf' : 'not_werewolf';
}

// Little Girl sees the wolves' current majority target — odd nights only.
export function littleGirlPeek(gameState) {
  if (gameState.round % 2 === 0) return null;
  return majorityTarget(gameState.nightActions.wolfVotes);
}
