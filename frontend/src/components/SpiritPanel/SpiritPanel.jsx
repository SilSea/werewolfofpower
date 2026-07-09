import { useState } from 'react';
import { emit } from '../../socket.js';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { CURSE_CARDS, curseCost } from '../../data/curseCards.js';
import Card from '../Card/Card.jsx';
import styles from './SpiritPanel.module.css';

export default function SpiritPanel({ myState, players, totalPlayers }) {
  const [spiritState, setSpiritState] = useState({ spiritPool: 0, proposals: [] });
  const [cardId, setCardId] = useState('');
  const [targetId, setTargetId] = useState('');

  useSocketEvent('spirit:update', (payload) => setSpiritState(payload));

  if (!myState?.isGhost) return null;

  const alive = players.filter((p) => p.alive);

  async function propose() {
    const res = await emit('spirit:propose', { cardId, targetId });
    if (res.ok) {
      setCardId('');
      setTargetId('');
    }
  }

  async function vote(proposalId) {
    await emit('spirit:vote', { proposalId });
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.pool}>Spirit Pool: {spiritState.spiritPool} point</p>

      <div className={styles.proposeForm}>
        <select value={cardId} onChange={(e) => setCardId(e.target.value)}>
          <option value="">เลือก curse card</option>
          {Object.entries(CURSE_CARDS).map(([id, card]) => (
            <option key={id} value={id}>
              {card.name} (cost {curseCost(id, totalPlayers)})
            </option>
          ))}
        </select>
        <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
          <option value="">เลือกเป้าหมาย</option>
          {alive.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button disabled={!cardId || !targetId} onClick={propose}>
          เสนอ
        </button>
      </div>

      <div className={styles.proposals}>
        {spiritState.proposals.map((p) => (
          <div key={p.id} className={styles.proposal}>
            <Card card={CURSE_CARDS[p.cardId]} cost={curseCost(p.cardId, totalPlayers)} size="sm" />
            <div className={styles.proposalInfo}>
              <p>เป้าหมาย: {players.find((pl) => pl.id === p.targetId)?.name}</p>
              <p>โหวต: {p.voteCount}</p>
              <button onClick={() => vote(p.id)}>โหวตให้ข้อนี้</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
