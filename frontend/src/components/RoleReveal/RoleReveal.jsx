import Card from '../Card/Card.jsx';
import { ROLES } from '../../data/roles.js';
import styles from './RoleReveal.module.css';

const FACTION_RARITY = { werewolf: 'epic', village: 'rare', neutral: 'legendary' };

export default function RoleReveal({ role, onDismiss }) {
  const data = ROLES[role];
  if (!data) return null;

  const card = { ...data, rarity: FACTION_RARITY[data.faction] ?? 'common', effect: data.ability };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <p className={styles.label}>คุณคือ</p>
        <Card card={card} size="lg" />
        <button className={styles.dismissButton} onClick={onDismiss}>
          เข้าใจแล้ว
        </button>
      </div>
    </div>
  );
}
