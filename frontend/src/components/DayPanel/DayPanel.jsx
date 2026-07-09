import { useState } from 'react';
import { emit } from '../../socket.js';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { colorForId } from '../../utils/avatarColor.js';
import styles from './DayPanel.module.css';

export default function DayPanel({ myState, players, voteResult }) {
  const [choice, setChoice] = useState(undefined);
  const [submitted, setSubmitted] = useState(false);
  const [liveTally, setLiveTally] = useState({});
  const [majorityThreshold, setMajorityThreshold] = useState(null);

  useSocketEvent('day:voteUpdate', (payload) => {
    setLiveTally(payload.tally);
    setMajorityThreshold(payload.majorityThreshold);
  });

  if (!myState?.alive) {
    return <div className={styles.wrap}>คุณตายแล้ว รอผลโหวต</div>;
  }

  const alive = players.filter((p) => p.alive);
  const threshold = majorityThreshold ?? Math.floor(alive.length / 2) + 1;

  async function vote(targetId) {
    setChoice(targetId);
    const res = await emit('day:vote', { targetId: targetId || null });
    if (res.ok) setSubmitted(true);
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>โหวตคนที่คิดว่าเป็น werewolf (หรือ Skip)</p>
      <p className={styles.threshold}>ต้องการ {threshold} โหวตขึ้นไป (เกินครึ่งของผู้รอดชีวิต) ถึงจะกำจัดได้</p>

      <div className={styles.row}>
        {alive
          .filter((p) => p.id !== myState.id)
          .map((p) => (
            <button
              key={p.id}
              className={[styles.tile, choice === p.id ? styles.selected : ''].join(' ')}
              onClick={() => vote(p.id)}
            >
              {liveTally[p.id] > 0 && <span className={styles.voteBadge}>{liveTally[p.id]}</span>}
              <span className={styles.avatar} style={{ background: colorForId(p.id) }}>
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span className={styles.name}>{p.name}</span>
            </button>
          ))}
        <button className={[styles.tile, choice === '' ? styles.selected : ''].join(' ')} onClick={() => vote('')}>
          <span className={styles.avatarSkip}>—</span>
          <span className={styles.name}>Skip</span>
        </button>
      </div>

      {submitted && <p className={styles.confirm}>โหวตแล้ว — เปลี่ยนใจได้จนกว่าจะหมดเวลา</p>}

      {voteResult && (
        <div className={styles.result}>
          {voteResult.blocked ? (
            <p>Vote ถูกบล็อกทั้งโต๊ะรอบนี้ (curse)</p>
          ) : voteResult.eliminatedId ? (
            <p>ผลโหวต: {players.find((p) => p.id === voteResult.eliminatedId)?.name} ถูกกำจัด</p>
          ) : (
            <p>ผลโหวต: เสมอ ไม่มีใครถูกกำจัด</p>
          )}
        </div>
      )}
    </div>
  );
}
