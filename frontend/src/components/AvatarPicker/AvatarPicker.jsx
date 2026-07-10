import { colorForId } from '../../utils/avatarColor.js';
import styles from './AvatarPicker.module.css';

export default function AvatarPicker({ options, value, onChange, subLabel, badge }) {
  return (
    <div className={styles.row}>
      {options.map((opt) => {
        const badgeValue = badge ? badge(opt) : null;
        return (
          <button
            key={opt.id}
            type="button"
            className={[styles.tile, value === opt.id ? styles.selected : ''].join(' ')}
            onClick={() => onChange(opt.id)}
          >
            {badgeValue > 0 && <span className={styles.badge}>{badgeValue}</span>}
            <span className={styles.avatar} style={{ background: colorForId(opt.id) }}>
              {opt.name.charAt(0).toUpperCase()}
            </span>
            <span className={styles.name}>{opt.name}</span>
            {subLabel && <span className={styles.subLabel}>{subLabel(opt)}</span>}
          </button>
        );
      })}
    </div>
  );
}
