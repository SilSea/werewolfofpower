import { useState } from 'react';
import { socket, emit } from '../../socket.js';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { colorForId } from '../../utils/avatarColor.js';
import styles from './RoomLobby.module.css';

const MIN_PLAYERS = 5;

export default function RoomLobby({ room: initialRoom }) {
  const [room, setRoom] = useState(initialRoom);
  const [error, setError] = useState(null);

  useSocketEvent('room:update', (updatedRoom) => setRoom(updatedRoom));

  const isHost = room.hostId === socket.id;
  const canStart = room.players.length >= MIN_PLAYERS;

  async function handleStart() {
    const res = await emit('game:start', {});
    if (!res.ok) setError(res.error);
  }

  return (
    <div className={styles.stage}>
      <div className={styles.wrap}>
        <p className={styles.eyebrow}>ห้องรอ</p>
        <h2 className={styles.roomCode}>{room.id}</h2>
        <p className={styles.hint}>ส่งรหัสห้องนี้ให้เพื่อนเข้าร่วม</p>

        <div className={styles.avatarGrid}>
          {room.players.map((p) => (
            <div key={p.id} className={styles.avatarSlot}>
              <div className={styles.avatar} style={{ background: colorForId(p.id) }}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span className={styles.avatarName}>{p.name}</span>
              {p.isHost && <span className={styles.hostBadge}>HOST</span>}
            </div>
          ))}
          {Array.from({ length: Math.max(0, MIN_PLAYERS - room.players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className={styles.avatarSlot}>
              <div className={styles.avatarEmpty}>?</div>
              <span className={styles.avatarNameEmpty}>รอผู้เล่น</span>
            </div>
          ))}
        </div>

        {isHost ? (
          <button className="btn btn-gold" disabled={!canStart} onClick={handleStart}>
            {canStart ? '🐺 เริ่มเกม' : `ต้องการผู้เล่นอย่างน้อย ${MIN_PLAYERS} คน (มี ${room.players.length})`}
          </button>
        ) : (
          <p className={styles.waiting}>รอ host เริ่มเกม...</p>
        )}
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
