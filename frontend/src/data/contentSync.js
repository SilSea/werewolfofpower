import { ACTION_CARDS } from './actionCards.js';
import { CURSE_CARDS } from './curseCards.js';
import { ROLES } from './roles.js';
import { UI_STRINGS } from './uiStrings.js';
import { socket } from '../socket.js';

const listeners = new Set();
let assetVersion = 0;

export function getAssetVersion() {
  return assetVersion;
}

function applyCatalog(catalog) {
  if (!catalog) return;
  assetVersion += 1; // busts cached <img> requests after any admin edit, including image uploads

  for (const [id, data] of Object.entries(catalog.actionCards ?? {})) {
    if (ACTION_CARDS[id]) {
      ACTION_CARDS[id].name = data.name;
      ACTION_CARDS[id].effect = data.effect;
    }
  }
  for (const [id, data] of Object.entries(catalog.curseCards ?? {})) {
    if (CURSE_CARDS[id]) {
      CURSE_CARDS[id].name = data.name;
      CURSE_CARDS[id].effect = data.effect;
    }
  }
  for (const [id, data] of Object.entries(catalog.roles ?? {})) {
    if (ROLES[id]) {
      ROLES[id].name = data.name;
      ROLES[id].ability = data.ability;
    }
  }
  for (const [key, text] of Object.entries(catalog.uiStrings ?? {})) {
    if (key in UI_STRINGS) UI_STRINGS[key] = text;
  }

  listeners.forEach((fn) => fn());
}

socket.on('content:catalog', applyCatalog);
socket.on('content:updated', applyCatalog);

export function onContentChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
