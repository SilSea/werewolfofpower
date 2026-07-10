import { getContentCatalog, updateContent, updateUiString } from '../admin/contentStore.js';
import { listRoomSummaries, getRoomAndGame } from '../admin/debugSerializer.js';
import { saveCardImage } from '../admin/imageStore.js';

function requireAdmin(socket) {
  return Boolean(socket.data.isAdmin);
}

export function registerAdminHandlers(io, socket) {
  socket.on('admin:login', ({ password } = {}, callback) => {
    if (!process.env.ADMIN_KEY) return callback?.({ ok: false, error: 'ADMIN_DISABLED' });
    if (password !== process.env.ADMIN_KEY) return callback?.({ ok: false, error: 'WRONG_PASSWORD' });
    socket.data.isAdmin = true;
    socket.join('admins');
    callback?.({ ok: true });
  });

  socket.on('admin:getContent', (_payload, callback) => {
    if (!requireAdmin(socket)) return callback?.({ ok: false, error: 'NOT_ADMIN' });
    callback?.({ ok: true, catalog: getContentCatalog() });
  });

  socket.on('admin:updateContent', async ({ type, id, name, description } = {}, callback) => {
    if (!requireAdmin(socket)) return callback?.({ ok: false, error: 'NOT_ADMIN' });
    try {
      const updated = await updateContent(type, id, { name, description });
      io.emit('content:updated', getContentCatalog());
      callback?.({ ok: true, updated });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('admin:updateUiString', async ({ key, text } = {}, callback) => {
    if (!requireAdmin(socket)) return callback?.({ ok: false, error: 'NOT_ADMIN' });
    try {
      const updated = await updateUiString(key, text);
      io.emit('content:updated', getContentCatalog());
      callback?.({ ok: true, updated });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('admin:uploadImage', async ({ type, id, dataUrl } = {}, callback) => {
    if (!requireAdmin(socket)) return callback?.({ ok: false, error: 'NOT_ADMIN' });
    try {
      const url = await saveCardImage(type, id, dataUrl);
      io.emit('content:updated', getContentCatalog()); // bumps clients' asset-version to bust image cache
      callback?.({ ok: true, url });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('admin:debugRooms', (_payload, callback) => {
    if (!requireAdmin(socket)) return callback?.({ ok: false, error: 'NOT_ADMIN' });
    callback?.({ ok: true, rooms: listRoomSummaries() });
  });

  socket.on('admin:debugRoomDetail', ({ roomId } = {}, callback) => {
    if (!requireAdmin(socket)) return callback?.({ ok: false, error: 'NOT_ADMIN' });
    const detail = getRoomAndGame(roomId);
    if (!detail) return callback?.({ ok: false, error: 'ROOM_NOT_FOUND' });
    callback?.({ ok: true, detail });
  });
}
