import { useEffect, useState } from 'react';
import styles from './PhaseTimer.module.css';

export default function PhaseTimer({ phaseEndsAt }) {
  const [remaining, setRemaining] = useState(computeRemaining(phaseEndsAt));

  useEffect(() => {
    setRemaining(computeRemaining(phaseEndsAt));
    const interval = setInterval(() => setRemaining(computeRemaining(phaseEndsAt)), 1000);
    return () => clearInterval(interval);
  }, [phaseEndsAt]);

  if (phaseEndsAt == null) return null;

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return <span className={[styles.timer, remaining <= 10 ? styles.urgent : ''].join(' ')}>{mm}:{ss}</span>;
}

function computeRemaining(phaseEndsAt) {
  if (phaseEndsAt == null) return 0;
  return Math.max(0, Math.round((phaseEndsAt - Date.now()) / 1000));
}
