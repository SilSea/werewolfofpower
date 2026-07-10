import { createRoom, joinRoom, leaveRoom, serializeRoom, getRoom, setEnabledRoles } from '../state/rooms.js';
import { registerGameHandlers } from './gameHandlers.js';
import { registerAdminHandlers } from './adminHandlers.js';
import { getContentCatalog } from '../admin/contentStore.js';
import { TOGGLEABLE_ROLES } from '../game/roles.js';

const MAX_NAME_LENGTH = 20;

function validateName(name) {
  return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= MAX_NAME_LENGTH;
}

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`player connected: ${socket.id}`);

    registerGameHandlers(io, socket);
    registerAdminHandlers(io, socket);
    socket.emit('content:catalog', getContentCatalog());

    socket.on('room:create', ({ playerName } = {}, callback) => {
      if (!validateName(playerName)) {
        return callback?.({ ok: false, error: 'INVALID_NAME' });
      }

      const room = createRoom(socket.id, playerName.trim());
      socket.join(room.id);
      socket.data.roomId = room.id;

      callback?.({ ok: true, room: serializeRoom(room) });
    });

    socket.on('room:join', ({ roomId, playerName } = {}, callback) => {
      if (!validateName(playerName)) {
        return callback?.({ ok: false, error: 'INVALID_NAME' });
      }

      try {
        const room = joinRoom(String(roomId ?? '').toUpperCase(), socket.id, playerName.trim());
        socket.join(room.id);
        socket.data.roomId = room.id;

        io.to(room.id).emit('room:update', serializeRoom(room));
        callback?.({ ok: true, room: serializeRoom(room) });
      } catch (err) {
        callback?.({ ok: false, error: err.message });
      }
    });

    socket.on('room:updateRoleSettings', ({ enabledRoles } = {}, callback) => {
      const roomId = socket.data.roomId;
      const room = getRoom(roomId);
      if (!room) return callback?.({ ok: false, error: 'ROOM_NOT_FOUND' });
      if (room.hostId !== socket.id) return callback?.({ ok: false, error: 'NOT_HOST' });
      if (!Array.isArray(enabledRoles) || enabledRoles.some((r) => !TOGGLEABLE_ROLES.includes(r))) {
        return callback?.({ ok: false, error: 'INVALID_ROLE_LIST' });
      }

      try {
        const updatedRoom = setEnabledRoles(roomId, enabledRoles);
        io.to(roomId).emit('room:update', serializeRoom(updatedRoom));
        callback?.({ ok: true });
      } catch (err) {
        callback?.({ ok: false, error: err.message });
      }
    });

    socket.on('room:leave', (_payload, callback) => {
      handleLeave(socket);
      callback?.({ ok: true });
    });

    socket.on('disconnect', () => {
      console.log(`player disconnected: ${socket.id}`);
      handleLeave(socket);
    });
  });

  function handleLeave(socket) {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = leaveRoom(roomId, socket.id);
    socket.leave(roomId);
    socket.data.roomId = null;

    if (room) {
      io.to(roomId).emit('room:update', serializeRoom(room));
    }
  }
}
