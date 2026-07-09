const AVATAR_COLORS = ['#dc2626', '#4c6ef5', '#f59e0b', '#22c55e', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];

export function colorForId(id) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
