import { colorForId } from '../../utils/avatarColor.js';
import styles from './AvatarPicker.module.css';

export default function AvatarPicker({ options, value, onChange, subLabel }) {
  return (
    <div className={styles.row}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={[styles.tile, value === opt.id ? styles.selected : ''].join(' ')}
          onClick={() => onChange(opt.id)}
        >
          <span className={styles.avatar} style={{ background: colorForId(opt.id) }}>
            {opt.name.charAt(0).toUpperCase()}
          </span>
          <span className={styles.name}>{opt.name}</span>
          {subLabel && <span className={styles.subLabel}>{subLabel(opt)}</span>}
        </button>
      ))}
    </div>
  );
}
