import Card from '../Card/Card.jsx';
import { ROLES } from '../../data/roles.js';
import styles from './MyRoleCard.module.css';

const FACTION_RARITY = { werewolf: 'epic', village: 'rare', neutral: 'legendary' };

export default function MyRoleCard({ role }) {
  const data = ROLES[role];
  if (!data) return null;

  const card = { ...data, rarity: FACTION_RARITY[data.faction] ?? 'common', effect: data.ability };

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>Role ของคุณ</p>
      <Card card={card} size="sm" />
    </div>
  );
}
