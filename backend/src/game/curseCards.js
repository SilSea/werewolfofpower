export const CURSE_CARDS = {
  whisper: { name: 'Whisper', category: 'info', costRatio: 0.10 },
  silence: { name: 'Silence', category: 'disrupt', costRatio: 0.20 },
  reveal_role: { name: 'Reveal Role', category: 'info', costRatio: 0.30 },
  nightmare: { name: 'Nightmare', category: 'disrupt', costRatio: 0.30 },
  chill: { name: 'Chill', category: 'disrupt_aoe', costRatio: 0.40 },
  weaken: { name: 'Weaken', category: 'disrupt', costRatio: 0.40 },
  false_accusation: { name: 'False Accusation', category: 'disrupt_aoe', costRatio: 0.60, limit: 'once_per_game' },
  mark_of_death: { name: 'Mark of Death', category: 'kill_tier', costRatio: 0.60 },
  curse_of_silence_council: { name: 'Curse of Silence Council', category: 'disrupt', costRatio: 0.70, limit: 'once_per_game' },
  soul_reap: { name: 'Soul Reap', category: 'kill_tier', costRatio: 0.90, limit: 'once_per_game' },
};

export function curseCost(cardId, totalPlayers) {
  const card = CURSE_CARDS[cardId];
  return Math.max(1, Math.ceil(totalPlayers * card.costRatio));
}
