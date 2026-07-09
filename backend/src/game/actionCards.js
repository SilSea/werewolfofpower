export const HAND_LIMIT = 3;
export const LEGENDARY_UNLOCK_ROUND = 3;

export const ACTION_CARDS = {
  peek_card: { name: 'Peek Card', category: 'info', rarity: 'common', usableWhen: 'any' },
  track: { name: 'Track', category: 'info', rarity: 'common', usableWhen: 'night' },
  silence: { name: 'Silence', category: 'offensive', rarity: 'common', usableWhen: 'day' },
  block_vote: { name: 'Block Vote', category: 'offensive', rarity: 'common', usableWhen: 'day_vote' },
  reveal_role: { name: 'Reveal Role', category: 'info', rarity: 'rare', usableWhen: 'day' },
  redirect_vote: { name: 'Redirect Vote', category: 'social', rarity: 'rare', usableWhen: 'day_vote' },
  extra_life: { name: 'Extra Life', category: 'defensive', rarity: 'rare', usableWhen: 'passive' },
  double_vote: { name: 'Double Vote', category: 'social', rarity: 'epic', usableWhen: 'day_vote' },
  mirror_shield: { name: 'Mirror Shield', category: 'defensive', rarity: 'epic', usableWhen: 'passive' },
  inherit_role: { name: 'Inherit Role', category: 'special', rarity: 'legendary', usableWhen: 'any_after_round_3' },
};

const RARITY_WEIGHTS = { common: 55, rare: 30, epic: 12, legendary: 3 };

// legendaryConsumed = Inherit Role is a single unique copy — once drawn by
// anyone it is removed from the pool for the rest of the game.
export function drawActionCard(round, legendaryConsumed) {
  const cardsByRarity = {};
  for (const [id, card] of Object.entries(ACTION_CARDS)) {
    if (card.rarity === 'legendary' && (round < LEGENDARY_UNLOCK_ROUND || legendaryConsumed)) continue;
    (cardsByRarity[card.rarity] ??= []).push(id);
  }

  const availableTiers = Object.keys(cardsByRarity);
  const totalWeight = availableTiers.reduce((sum, tier) => sum + RARITY_WEIGHTS[tier], 0);

  let roll = Math.random() * totalWeight;
  let chosenTier = availableTiers[availableTiers.length - 1];
  for (const tier of availableTiers) {
    roll -= RARITY_WEIGHTS[tier];
    if (roll <= 0) {
      chosenTier = tier;
      break;
    }
  }

  const pool = cardsByRarity[chosenTier];
  return pool[Math.floor(Math.random() * pool.length)];
}
