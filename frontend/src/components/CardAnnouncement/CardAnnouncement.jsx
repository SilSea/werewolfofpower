import Card from '../Card/Card.jsx';
import styles from './CardAnnouncement.module.css';

export default function CardAnnouncement({ announcement, onDismiss }) {
  if (!announcement) return null;
  const { card, title, subtitle, extraCards } = announcement;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <p className={styles.title}>{title}</p>
        <Card card={card} size="lg" />
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {extraCards && extraCards.length > 0 && (
          <div className={styles.extraRow}>
            {extraCards.map((c, i) => (
              <Card key={i} card={c} size="sm" />
            ))}
          </div>
        )}
        <button className={styles.dismissButton} onClick={onDismiss}>
          ปิด
        </button>
      </div>
    </div>
  );
}
