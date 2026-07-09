import { emit } from '../../socket.js';
import styles from './HostControls.module.css';

export default function HostControls({ isHost, phase }) {
  if (!isHost) return null;
  if (phase !== 'night' && phase !== 'day') return null;

  async function resolve() {
    const event = phase === 'night' ? 'game:resolveNight' : 'game:resolveDay';
    const res = await emit(event, {});
    if (!res.ok) alert(res.error);
  }

  return (
    <div className={styles.wrap}>
      <button onClick={resolve}>{phase === 'night' ? 'ประกาศผลกลางคืน' : 'ประกาศผลโหวต'}</button>
    </div>
  );
}
