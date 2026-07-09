const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
const ROOM_CODE_LENGTH = 6;

const rooms = new Map();

function generateRoomCode() {
  let code;
  do {
    code = Array.from(
      { length: ROOM_CODE_LENGTH },
      () => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

export function createRoom(hostId, hostName) {
  const roomId = generateRoomCode();
  const room = {
    id: roomId,
    hostId,
    phase: 'lobby',
    round: 0,
    players: new Map(),
  };
  room.players.set(hostId, {
    id: hostId,
    name: hostName,
    alive: true,
    isGhost: false,
    isHost: true,
  });
  rooms.set(roomId, room);
  return room;
}

export function joinRoom(roomId, playerId, playerName) {
  const room = rooms.get(roomId);
  if (!room) throw new Error('ROOM_NOT_FOUND');
  if (room.phase !== 'lobby') throw new Error('GAME_ALREADY_STARTED');
  if (room.players.has(playerId)) throw new Error('ALREADY_IN_ROOM');

  room.players.set(playerId, {
    id: playerId,
    name: playerName,
    alive: true,
    isGhost: false,
    isHost: false,
  });
  return room;
}

export function leaveRoom(roomId, playerId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.players.delete(playerId);

  if (room.players.size === 0) {
    rooms.delete(roomId);
    return null;
  }

  if (room.hostId === playerId) {
    const nextHostId = room.players.keys().next().value;
    room.hostId = nextHostId;
    room.players.get(nextHostId).isHost = true;
  }

  return room;
}

export function getRoom(roomId) {
  return rooms.get(roomId);
}

export function serializeRoom(room) {
  return {
    id: room.id,
    phase: room.phase,
    round: room.round,
    hostId: room.hostId,
    players: Array.from(room.players.values()),
  };
}
