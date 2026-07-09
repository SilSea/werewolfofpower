import styles from './WinScreen.module.css';

const FACTION_LABEL = {
  village: 'ฝ่าย Village ชนะ',
  werewolf: 'ฝ่าย Werewolf ชนะ',
  tanner: 'Tanner ชนะเดี่ยว',
  lovers: 'Lovers ชนะร่วมกัน',
};

export default function WinScreen({ winner, players, onReturnToRoom }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h2>{FACTION_LABEL[winner.faction] ?? winner.faction}</h2>
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
