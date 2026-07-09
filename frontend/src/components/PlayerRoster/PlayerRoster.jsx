import { colorForId } from '../../utils/avatarColor.js';
import styles from './PlayerRoster.module.css';

export default function PlayerRoster({ players, selfId }) {
  return (
    <div className={styles.wrap}>
      <p className={styles.title}>ผู้เล่น ({players.filter((p) => p.alive).length} มีชีวิต)</p>
      <div className={styles.grid}>
        {players.map((p) => (
          <div
            key={p.id}
            className={[
              styles.seat,
              !p.alive ? styles.dead : '',
              p.isGhost ? styles.ghost : '',
              p.id === selfId ? styles.self : '',
            ].join(' ')}
          >
            <div className={styles.avatar} style={{ background: colorForId(p.id) }}>
              {p.name.charAt(0).toUpperCase()}
              {!p.alive && <span className={styles.skull}>💀</span>}
            </div>
            <span className={styles.name}>{p.name}</span>
            {p.isGhost && <span className={styles.ghostTag}>GHOST</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
