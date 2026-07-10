import { useState } from 'react';
import { emit } from '../socket.js';
import styles from './DebugTab.module.css';

export default function DebugTab() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    const res = await emit('admin:debugRooms', {});
    setLoading(false);
    if (res.ok) setRooms(res.rooms);
  }

  async function openRoom(roomId) {
    setSelectedRoomId(roomId);
    const res = await emit('admin:debugRoomDetail', { roomId });
    if (res.ok) setDetail(res.detail);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.roomList}>
        <button className={styles.refreshButton} onClick={refresh} disabled={loading}>
          {loading ? 'กำลังโหลด...' : 'รีเฟรชรายการห้อง'}
        </button>
        {rooms.length === 0 && <p className={styles.empty}>ไม่มีห้อง (กดรีเฟรช)</p>}
        {rooms.map((r) => (
          <button
            key={r.id}
            className={[styles.roomItem, r.id === selectedRoomId ? styles.selected : ''].join(' ')}
            onClick={() => openRoom(r.id)}
          >
            <strong>{r.id}</strong> — {r.playerCount} คน — {r.game ? `${r.game.phase} R${r.game.round}` : r.lobbyPhase}
          </button>
        ))}
      </div>
      <div className={styles.detail}>
        {detail ? (
          <pre className={styles.json}>{JSON.stringify(detail, null, 2)}</pre>
        ) : (
          <p className={styles.empty}>เลือกห้องเพื่อดูรายละเอียด</p>
        )}
      </div>
    </div>
  );
}
