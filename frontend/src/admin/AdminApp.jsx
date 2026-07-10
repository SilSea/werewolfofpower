import { useState } from 'react';
import { emit } from '../socket.js';
import DebugTab from './DebugTab.jsx';
import ContentTab from './ContentTab.jsx';
import styles from './AdminApp.module.css';

export default function AdminApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('debug');

  async function login() {
    setError(null);
    const res = await emit('admin:login', { password });
    if (res.ok) setLoggedIn(true);
    else setError(res.error);
  }

  if (!loggedIn) {
    return (
      <div className={styles.loginStage}>
        <div className={styles.moon} />
        <div className={styles.loginPanel}>
          <h1 className={styles.title}>
            <span className={styles.wolfIcon}>🐺</span>
            ADMIN
          </h1>
          <p className={styles.subtitle}>Werewolf Online — Control Room</p>
          <input
            className={styles.input}
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
          />
          <button className={styles.loginButton} onClick={login}>
            เข้าสู่ระบบ
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>🐺</span>
        <h1 className={styles.headerTitle}>Werewolf Admin</h1>
      </div>
      <div className={styles.tabBar}>
        <button className={tab === 'debug' ? styles.activeTab : styles.tab} onClick={() => setTab('debug')}>
          🔍 Debug
        </button>
        <button className={tab === 'content' ? styles.activeTab : styles.tab} onClick={() => setTab('content')}>
          🎴 Content Editor
        </button>
      </div>
      {tab === 'debug' ? <DebugTab /> : <ContentTab />}
    </div>
  );
}
