// Uploaded card/role art is served by the backend (admin panel uploads it
// there — see ContentTab). Path is deterministic: /uploads/cards/<folder>/<id>.png.
// Card.jsx falls back to a placeholder automatically if nothing was ever uploaded.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function cardImageUrl(folder, id) {
  return `${BACKEND_URL}/uploads/cards/${folder}/${id}.png`;
}
