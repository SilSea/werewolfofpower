import { pool } from './pool.js';

function buildDeathInfo(gameState) {
  const deathByPlayer = new Map();
  for (const entry of gameState.log) {
    if (entry.type === 'death') {
      deathByPlayer.set(entry.playerId, { round: entry.round, cause: entry.cause });
    }
  }
  return deathByPlayer;
}

function cardsUsedByPlayer(gameState) {
  const map = new Map();
  for (const entry of gameState.log) {
    if (entry.type === 'card_played') {
      const list = map.get(entry.playerId) ?? [];
      list.push({ cardId: entry.cardId, round: entry.round });
      map.set(entry.playerId, list);
    }
  }
  return map;
}

function cursesProposedByPlayer(gameState) {
  const map = new Map();
  for (const entry of gameState.log) {
    if (entry.type === 'curse_queued') {
      const list = map.get(entry.proposerId) ?? [];
      list.push({ cardId: entry.cardId, targetId: entry.targetId, round: entry.round });
      map.set(entry.proposerId, list);
    }
  }
  return map;
}

export async function persistGameResult(room, gameState) {
  const deaths = buildDeathInfo(gameState);
  const cardsUsed = cardsUsedByPlayer(gameState);
  const cursesProposed = cursesProposedByPlayer(gameState);
  const winnerIds = new Set(gameState.winner?.playerIds ?? []);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const gameRes = await client.query(
      `INSERT INTO games (room_code, player_count, rounds_played, winning_faction, ended_at)
       VALUES ($1, $2, $3, $4, now()) RETURNING id`,
      [room.id, gameState.totalPlayers, gameState.round, gameState.winner?.faction ?? null]
    );
    const gameId = gameRes.rows[0].id;

    for (const [playerId, player] of gameState.players) {
      const death = deaths.get(playerId);
      await client.query(
        `INSERT INTO game_players
           (game_id, player_name, starting_role, final_role, faction, survived, is_winner,
            died_round, death_cause, became_ghost, action_cards_used, curse_cards_proposed)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          gameId,
          room.players.get(playerId)?.name ?? 'unknown',
          player.startingRole,
          player.role !== player.startingRole ? player.role : null,
          player.faction,
          player.alive,
          winnerIds.has(playerId),
          death?.round ?? null,
          death?.cause ?? null,
          player.isGhost,
          JSON.stringify(cardsUsed.get(playerId) ?? []),
          JSON.stringify(cursesProposed.get(playerId) ?? []),
        ]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
