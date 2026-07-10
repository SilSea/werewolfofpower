import { UI_STRINGS, uiText } from '../../data/uiStrings.js';
import styles from './WinScreen.module.css';

export default function WinScreen({ winner, players, onReturnToRoom }) {
  const key = `win.${winner.faction}`;
  const label = key in UI_STRINGS ? uiText(key) : winner.faction;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h2>{label}</h2>
        <ul className={styles.winnerList}>
          {winner.playerIds.map((id) => (
            <li key={id}>{players.find((p) => p.id === id)?.name ?? id}</li>
          ))}
        </ul>
        <button className={styles.returnButton} onClick={onReturnToRoom}>
          กลับไปห้อง
        </button>
      </div>
    </div>
  );
}
