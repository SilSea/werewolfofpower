import Card from '../Card/Card.jsx';
import styles from './CardDetailModal.module.css';

export default function CardDetailModal({ card, cost, onClose }) {
  if (!card) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <Card card={card} cost={cost} size="lg" />
        <button className={styles.closeButton} onClick={onClose}>
          ปิด
        </button>
      </div>
    </div>
  );
}
