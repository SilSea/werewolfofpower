import { UI_STRINGS, uiText } from '../data/uiStrings.js';

export function deathCauseLabel(cause) {
  const key = `death.${cause}`;
  return key in UI_STRINGS ? uiText(key) : cause;
}

export function curseEffectSummary(result, players, roleLabel) {
  const key = `curse.${result.cardId}`;
  if (!(key in UI_STRINGS)) return null; // e.g. whisper — delivered privately, not summarized here
  const name = players.find((p) => p.id === result.targetId)?.name ?? result.targetId;
  return uiText(key, { name, role: roleLabel });
}
