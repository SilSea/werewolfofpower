import { useState } from 'react';
import { emit } from '../../socket.js';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { CURSE_CARDS, curseCost } from '../../data/curseCards.js';
import Card from '../Card/Card.jsx';
import AvatarPicker from '../AvatarPicker/AvatarPicker.jsx';
import CardDetailModal from '../CardDetailModal/CardDetailModal.jsx';
import styles from './SpiritPanel.module.css';

export default function SpiritPanel({ myState, players, totalPlayers, spiritPool }) {
  const [proposals, setProposals] = useState([]);
  const [cardId, setCardId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [viewingCard, setViewingCard] = useState(null);

  // Proposals are ghost-only and need real-time sync via a dedicated
  // broadcast; the pool number itself comes from the public game state
  // (publicState.spiritPool) so it stays correct even before any ghost
  // has proposed/voted this game.
  useSocketEvent('spirit:update', (payload) => setProposals(payload.proposals));

  if (!myState?.isGhost) return null;

  const alive = players.filter((p) => p.alive);

  async function propose() {
    setError(null);
    const res = await emit('spirit:propose', { cardId, targetId, message: cardId === 'whisper' ? message : undefined });
    if (res.ok) {
      setCardId('');
      setTargetId('');
      setMessage('');
    } else {
      setError(res.error);
    }
  }

  const canPropose = targetId && (cardId !== 'whisper' || message.trim());

  async function vote(proposalId) {
    await emit('spirit:vote', { proposalId });
  }

  const selectedCard = cardId ? CURSE_CARDS[cardId] : null;

  return (
    <div className={styles.wrap}>
      <p className={styles.pool}>Spirit Pool: {spiritPool} point</p>

      <p className={styles.stepLabel}>เลือก curse card</p>
      <div className={styles.cardGrid}>
        {Object.entries(CURSE_CARDS).map(([id, card]) => (
          <Card
            key={id}
            card={card}
            cost={curseCost(id, totalPlayers)}
            size="sm"
            selected={cardId === id}
            onClick={() => setCardId(id === cardId ? '' : id)}
            onViewDetails={(card, cost) => setViewingCard({ card, cost })}
          />
        ))}
      </div>

      <CardDetailModal card={viewingCard?.card} cost={viewingCard?.cost} onClose={() => setViewingCard(null)} />

      {selectedCard && (
        <>
          <p className={styles.stepLabel}>เลือกเป้าหมาย</p>
          <AvatarPicker options={alive} value={targetId} onChange={setTargetId} />
          {cardId === 'whisper' && (
            <>
              <p className={styles.stepLabel}>ข้อความลึกลับ (ส่งถึงเป้าหมายคนเดียว)</p>
              <textarea
                className={styles.messageInput}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                rows={2}
                placeholder="พิมพ์ข้อความ..."
              />
            </>
          )}
          <button className={styles.proposeButton} disabled={!canPropose} onClick={propose}>
            เสนอ {selectedCard.name} (cost {curseCost(cardId, totalPlayers)})
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </>
      )}

      <div className={styles.proposals}>
        {proposals.map((p) => (
          <div key={p.id} className={styles.proposal}>
            <Card
              card={CURSE_CARDS[p.cardId]}
              cost={curseCost(p.cardId, totalPlayers)}
              size="sm"
              onViewDetails={(card, cost) => setViewingCard({ card, cost })}
            />
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
