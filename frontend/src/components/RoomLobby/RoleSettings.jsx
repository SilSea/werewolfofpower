import { emit } from '../../socket.js';
import { ROLES } from '../../data/roles.js';
import styles from './RoleSettings.module.css';

const ROLE_ICON = {
  seer: '👁️',
  doctor: '🩺',
  witch: '🧪',
  hunter: '🏹',
  bodyguard: '🛡️',
  cupid: '💘',
  little_girl: '🎀',
  tanner: '🎭',
  wolf_cub: '🐺',
};

const TOGGLEABLE_ROLE_IDS = ['seer', 'doctor', 'witch', 'hunter', 'bodyguard', 'cupid', 'little_girl', 'tanner', 'wolf_cub'];

export default function RoleSettings({ enabledRoles, isHost, playerCount }) {
  const wolfCount = Math.max(1, Math.floor(playerCount / 4));
  const requiredSlots = wolfCount + enabledRoles.filter((r) => r !== 'wolf_cub').length;
  const overflow = requiredSlots > playerCount;

  async function toggle(roleId) {
    if (!isHost) return;
    const next = enabledRoles.includes(roleId) ? enabledRoles.filter((r) => r !== roleId) : [...enabledRoles, roleId];
    await emit('room:updateRoleSettings', { enabledRoles: next });
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.title}>Role เสริมในห้องนี้</p>
      <p className={styles.subtitle}>Werewolf + Villager มีเสมอเป็นพื้นฐาน (wolf count auto ตามจำนวนผู้เล่น)</p>

      <div className={styles.grid}>
        {TOGGLEABLE_ROLE_IDS.map((roleId) => {
          const active = enabledRoles.includes(roleId);
          return (
            <button
              key={roleId}
              type="button"
              className={[styles.rolePill, active ? styles.active : '', !isHost ? styles.readOnly : ''].join(' ')}
              onClick={() => toggle(roleId)}
              disabled={!isHost}
            >
              <span className={styles.roleIcon}>{ROLE_ICON[roleId] ?? '🃏'}</span>
              {ROLES[roleId]?.name ?? roleId}
            </button>
          );
        })}
      </div>

      <p className={[styles.slotInfo, overflow ? styles.overflow : ''].join(' ')}>
        ต้องการอย่างน้อย {requiredSlots} ที่นั่ง (มีผู้เล่น {playerCount} คน)
        {overflow && ' — เกิน! ต้องปิด role บางตัวก่อนเริ่มเกม'}
      </p>
    </div>
  );
}

export function roleSettingsOverflow(enabledRoles, playerCount) {
  const wolfCount = Math.max(1, Math.floor(playerCount / 4));
  const requiredSlots = wolfCount + enabledRoles.filter((r) => r !== 'wolf_cub').length;
  return requiredSlots > playerCount;
}
