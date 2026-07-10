import { colorForId } from '../../utils/avatarColor.js';
import { deathCauseLabel, curseEffectSummary } from '../../utils/deathCauseLabel.js';
import { ROLES } from '../../data/roles.js';
import styles from './NightRecapModal.module.css';

export default function NightRecapModal({ recap, players, onClose }) {
  if (!recap) return null;
  const { round, deaths, curseResults } = recap;

  const curseLines = (curseResults ?? [])
    .map((r) => curseEffectSummary(r, players, r.role ? ROLES[r.role]?.name : undefined))
    .filter(Boolean);

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <p className={styles.title}>🌅 เช้านี้ — Round {round}</p>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>เหตุการณ์กลางคืน</p>
          {deaths.length === 0 && <p className={styles.empty}>ไม่มีใครตายคืนนี้</p>}
          {deaths.map((d) => {
            const player = players.find((p) => p.id === d.playerId);
            return (
              <div key={d.playerId} className={styles.row}>
                <span className={styles.avatar} style={{ background: colorForId(d.playerId) }}>
                  {player?.name.charAt(0).toUpperCase() ?? '?'}
                </span>
                <span>
                  <strong>{player?.name ?? d.playerId}</strong> — {deathCauseLabel(d.cause)}
                </span>
              </div>
            );
          })}
        </div>

        {curseLines.length > 0 && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>คำสาปที่มีผลเช้านี้</p>
            {curseLines.map((line, i) => (
              <p key={i} className={styles.curseLine}>
                👻 {line}
              </p>
            ))}
          </div>
        )}

        <button className={styles.closeButton} onClick={onClose}>
          รับทราบ
        </button>
      </div>
    </div>
  );
}
