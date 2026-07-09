import { useState } from 'react';
import styles from './Card.module.css';

const RARITY_LABEL = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export default function Card({ card, cost, selected, disabled, onClick, size = 'md' }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (!card) return null;

  const rarity = card.rarity ?? 'common';
  const clickable = typeof onClick === 'function';

  return (
    <div
      className={[
        styles.card,
        styles[`rarity-${rarity}`],
        styles[`size-${size}`],
        selected ? styles.selected : '',
        disabled ? styles.disabled : '',
        clickable ? styles.clickable : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={!disabled && clickable ? () => onClick(card) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable && !disabled ? 0 : undefined}
    >
      <div className={styles.rarityTag}>{RARITY_LABEL[rarity] ?? rarity}</div>
      {cost != null && <div className={styles.costBadge}>{cost}</div>}

      <div className={styles.imageArea}>
        {card.image && !imageFailed ? (
          <img
            src={card.image}
            alt={card.name}
            className={styles.image}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span>{card.name}</span>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.name}>{card.name}</div>
        {card.category && <div className={styles.category}>{card.category}</div>}
        <div className={styles.effect}>{card.effect ?? card.ability}</div>
        {card.limit && <div className={styles.limit}>{card.limit}</div>}
      </div>
    </div>
  );
}
