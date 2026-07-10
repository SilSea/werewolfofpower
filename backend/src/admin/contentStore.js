import { pool } from '../db/pool.js';
import { ROLES } from '../game/roles.js';
import { ACTION_CARDS } from '../game/actionCards.js';
import { CURSE_CARDS } from '../game/curseCards.js';
import { UI_STRING_DEFAULTS } from './uiStringDefaults.js';

// Only name/effect text is admin-editable — rarity, cost, faction, and
// every mechanical field stay defined in code. This cache is the merged
// (code defaults + DB overrides) text served to clients.
const cache = {
  roles: {},
  actionCards: {},
  curseCards: {},
  uiStrings: {},
};

function seedDefaults() {
  for (const id of Object.keys(ROLES)) cache.roles[id] = { name: id, ability: '' };
  for (const id of Object.keys(ACTION_CARDS)) cache.actionCards[id] = { name: id, effect: '' };
  for (const id of Object.keys(CURSE_CARDS)) cache.curseCards[id] = { name: id, effect: '' };
  cache.uiStrings = { ...UI_STRING_DEFAULTS };
}

export async function loadContentCache() {
  seedDefaults();

  const roleRows = await pool.query('SELECT id, name, ability FROM roles');
  for (const row of roleRows.rows) {
    if (cache.roles[row.id]) cache.roles[row.id] = { name: row.name, ability: row.ability };
  }

  const actionRows = await pool.query('SELECT id, name, effect FROM action_cards');
  for (const row of actionRows.rows) {
    if (cache.actionCards[row.id]) cache.actionCards[row.id] = { name: row.name, effect: row.effect };
  }

  const curseRows = await pool.query('SELECT id, name, effect FROM curse_cards');
  for (const row of curseRows.rows) {
    if (cache.curseCards[row.id]) cache.curseCards[row.id] = { name: row.name, effect: row.effect };
  }

  // ui_strings has no static SQL seed — insert any default key missing from
  // the DB (first boot, or a key added to uiStringDefaults.js since).
  const missingKeys = Object.keys(UI_STRING_DEFAULTS);
  if (missingKeys.length > 0) {
    const values = missingKeys.map((key, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
    const params = missingKeys.flatMap((key) => [key, UI_STRING_DEFAULTS[key]]);
    await pool.query(`INSERT INTO ui_strings (key, text) VALUES ${values} ON CONFLICT (key) DO NOTHING`, params);
  }

  const uiRows = await pool.query('SELECT key, text FROM ui_strings');
  for (const row of uiRows.rows) {
    if (row.key in cache.uiStrings) cache.uiStrings[row.key] = row.text;
  }
}

export function getContentCatalog() {
  return cache;
}

const TYPE_CONFIG = {
  role: { table: 'roles', textColumn: 'ability', validIds: ROLES, cacheKey: 'roles' },
  action_card: { table: 'action_cards', textColumn: 'effect', validIds: ACTION_CARDS, cacheKey: 'actionCards' },
  curse_card: { table: 'curse_cards', textColumn: 'effect', validIds: CURSE_CARDS, cacheKey: 'curseCards' },
};

export async function updateContent(type, id, { name, description }) {
  const config = TYPE_CONFIG[type];
  if (!config) throw new Error('UNKNOWN_CONTENT_TYPE');
  if (!config.validIds[id]) throw new Error('UNKNOWN_CONTENT_ID');
  if (typeof name !== 'string' || !name.trim()) throw new Error('NAME_REQUIRED');
  if (typeof description !== 'string' || !description.trim()) throw new Error('DESCRIPTION_REQUIRED');

  await pool.query(
    `UPDATE ${config.table} SET name = $1, ${config.textColumn} = $2 WHERE id = $3`,
    [name.trim(), description.trim(), id]
  );

  cache[config.cacheKey][id] = { name: name.trim(), [config.textColumn]: description.trim() };
  return cache[config.cacheKey][id];
}

export async function updateUiString(key, text) {
  if (!(key in UI_STRING_DEFAULTS)) throw new Error('UNKNOWN_UI_STRING_KEY');
  if (typeof text !== 'string' || !text.trim()) throw new Error('TEXT_REQUIRED');

  await pool.query('UPDATE ui_strings SET text = $1 WHERE key = $2', [text.trim(), key]);
  cache.uiStrings[key] = text.trim();
  return cache.uiStrings[key];
}
