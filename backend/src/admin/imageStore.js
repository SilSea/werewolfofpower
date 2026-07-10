import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ROLES } from '../game/roles.js';
import { ACTION_CARDS } from '../game/actionCards.js';
import { CURSE_CARDS } from '../game/curseCards.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = join(__dirname, '..', '..', 'uploads', 'cards');
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

const TYPE_CONFIG = {
  role: { folder: 'roles', validIds: ROLES },
  action_card: { folder: 'action', validIds: ACTION_CARDS },
  curse_card: { folder: 'curse', validIds: CURSE_CARDS },
};

export function uploadsDir() {
  return join(__dirname, '..', '..', 'uploads');
}

// dataUrl must be a base64 PNG data URI (data:image/png;base64,...). Saved
// at a path deterministic from type+id, so no DB record is needed — the
// frontend always requests /uploads/cards/<folder>/<id>.png.
export async function saveCardImage(type, id, dataUrl) {
  const config = TYPE_CONFIG[type];
  if (!config) throw new Error('UNKNOWN_CONTENT_TYPE');
  if (!config.validIds[id]) throw new Error('UNKNOWN_CONTENT_ID');

  const match = /^data:image\/png;base64,([a-zA-Z0-9+/=]+)$/.exec(dataUrl ?? '');
  if (!match) throw new Error('MUST_BE_PNG_DATA_URL');

  const buffer = Buffer.from(match[1], 'base64');
  if (buffer.length === 0) throw new Error('EMPTY_IMAGE');
  if (buffer.length > MAX_BYTES) throw new Error('IMAGE_TOO_LARGE');

  const dir = join(UPLOADS_ROOT, config.folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${id}.png`), buffer);

  return `/uploads/cards/${config.folder}/${id}.png`;
}
