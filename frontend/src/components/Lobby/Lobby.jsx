import { useState } from 'react';
import { emit } from '../../socket.js';
import styles from './Lobby.module.css';

export default function Lobby({ onJoined }) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    const res = await emit('room:create', { playerName: name });
    setBusy(false);
    if (res.ok) onJoined(res.room);
    else setError(res.error);
  }

  async function handleJoin() {
    setBusy(true);
    setError(null);
    const res = await emit('room:join', { roomId: roomCode, playerName: name });
    setBusy(false);
    if (res.ok) onJoined(res.room);
    else setError(res.error);
  }

  return (
    <div className={styles.stage}>
      <div className={styles.moon} />
      <div className={styles.wrap}>
        <h1 className={styles.title}>
          <span className={styles.wolfIcon}>🐺</span>
          WEREWOLF
        </h1>
        <p className={styles.subtitle}>ONLINE — สาปเมือง สาปคน</p>

        <input
          className={styles.input}
          placeholder="ชื่อผู้เล่น"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
        />
        <button className={`btn btn-primary ${styles.fullWidth}`} disabled={busy || !name} onClick={handleCreate}>
          สร้างห้อง
        </button>

        <div className={styles.divider}>
          <span>หรือ</span>
        </div>

        <div className={styles.joinRow}>
          <input
            className={styles.input}
            placeholder="รหัสห้อง"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <button className="btn btn-gold" disabled={busy || !name || !roomCode} onClick={handleJoin}>
            เข้าห้อง
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
