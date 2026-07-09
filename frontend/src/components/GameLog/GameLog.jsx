import styles from './GameLog.module.css';

export default function GameLog({ entries }) {
  return (
    <div className={styles.wrap}>
      <p className={styles.title}>Log</p>
      <div className={styles.entries}>
        {entries.length === 0 && <p className={styles.empty}>ยังไม่มีเหตุการณ์</p>}
        {entries
          .slice()
          .reverse()
          .map((entry, i) => (
            <p key={i} className={styles.entry}>
              {entry}
            </p>
          ))}
      </div>
    </div>
  );
}
