import { useState } from 'react';
import Card from '../Card/Card.jsx';
import AvatarPicker from '../AvatarPicker/AvatarPicker.jsx';
import CardDetailModal from '../CardDetailModal/CardDetailModal.jsx';
import { ACTION_CARDS } from '../../data/actionCards.js';
import { ROLES } from '../../data/roles.js';
import { emit } from '../../socket.js';
import styles from './Hand.module.css';

const PASSIVE_CARDS = new Set(['extra_life', 'mirror_shield']);
const NO_TARGET_CARDS = new Set(['double_vote']);
const DOUBLE_TARGET_CARDS = new Set(['redirect_vote']);
const DEAD_TEAMMATE_CARDS = new Set(['inherit_role']);

export default function Hand({ cards, players, deadTeammates, pendingCardChoice, phase, round, onPlayed }) {
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [targetId, setTargetId] = useState('');
  const [redirectToId, setRedirectToId] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [viewingCard, setViewingCard] = useState(null);

  if (pendingCardChoice) {
    return <HandOverflowChoice candidates={pendingCardChoice} />;
  }

  const selectedCard = selectedCardId ? ACTION_CARDS[selectedCardId] : null;
  const others = players.filter((p) => p.alive);
  const deadTeammateOptions = (deadTeammates ?? []).map((t) => ({
    id: t.id,
    name: players.find((p) => p.id === t.id)?.name ?? t.id,
    role: t.role,
  }));

  function selectCard(cardId) {
    if (PASSIVE_CARDS.has(cardId)) return;
    setSelectedCardId(cardId === selectedCardId ? null : cardId);
    setTargetId('');
    setRedirectToId('');
    setError(null);
  }

  function canPlay() {
    if (!selectedCard) return false;
    if (NO_TARGET_CARDS.has(selectedCardId)) return true;
    if (DOUBLE_TARGET_CARDS.has(selectedCardId)) return targetId && redirectToId && targetId !== redirectToId;
    return Boolean(targetId);
  }

  async function handlePlay() {
    setBusy(true);
    setError(null);
    const payload = { cardId: selectedCardId };
    if (DEAD_TEAMMATE_CARDS.has(selectedCardId)) payload.deadTeammateId = targetId;
    else if (DOUBLE_TARGET_CARDS.has(selectedCardId)) {
      payload.targetId = targetId;
      payload.redirectToId = redirectToId;
    } else if (!NO_TARGET_CARDS.has(selectedCardId)) {
      payload.targetId = targetId;
    }

    const res = await emit('card:play', payload);
    setBusy(false);
    if (res.ok) {
      onPlayed?.(selectedCardId, res.result);
      setSelectedCardId(null);
      setTargetId('');
      setRedirectToId('');
    } else {
      setError(res.error);
    }
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.title}>Card ในมือ ({cards.length}/3)</p>
      <div className={styles.hand}>
        {cards.map((cardId, i) => (
          <Card
            key={`${cardId}-${i}`}
            card={ACTION_CARDS[cardId]}
            size="sm"
            selected={cardId === selectedCardId}
            disabled={PASSIVE_CARDS.has(cardId)}
            onClick={() => selectCard(cardId)}
            onViewDetails={(card) => setViewingCard(card)}
          />
        ))}
        {cards.length === 0 && <p className={styles.empty}>ไม่มีการ์ดในมือ</p>}
      </div>

      <CardDetailModal card={viewingCard} onClose={() => setViewingCard(null)} />

      {selectedCard && (
        <div className={styles.playPanel}>
          <p className={styles.playPanelTitle}>ใช้ {selectedCard.name}</p>

          {DEAD_TEAMMATE_CARDS.has(selectedCardId) ? (
            <>
              <p className={styles.stepLabel}>เลือก teammate ที่ตายแล้ว</p>
              <AvatarPicker
                options={deadTeammateOptions}
                value={targetId}
                onChange={setTargetId}
                subLabel={(opt) => ROLES[opt.role]?.name ?? opt.role}
              />
              {deadTeammateOptions.length === 0 && <p className={styles.hint}>ยังไม่มี teammate ที่ตาย</p>}
            </>
          ) : NO_TARGET_CARDS.has(selectedCardId) ? (
            <p className={styles.hint}>การ์ดนี้ไม่ต้องเลือกเป้าหมาย</p>
          ) : (
            <>
              <p className={styles.stepLabel}>เลือกเป้าหมาย</p>
              <AvatarPicker options={others} value={targetId} onChange={setTargetId} />
              {DOUBLE_TARGET_CARDS.has(selectedCardId) && (
                <>
                  <p className={styles.stepLabel}>โหวตไปที่ใครแทน (เจ้าตัวไม่รู้)</p>
                  <AvatarPicker
                    options={others.filter((p) => p.id !== targetId)}
                    value={redirectToId}
                    onChange={setRedirectToId}
                  />
                </>
              )}
            </>
          )}

          <button disabled={!canPlay() || busy} onClick={handlePlay}>
            ยืนยันใช้การ์ด
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      )}
    </div>
  );
}

function HandOverflowChoice({ candidates }) {
  const [keep, setKeep] = useState([]);
  const [busy, setBusy] = useState(false);
  const [viewingCard, setViewingCard] = useState(null);

  function toggle(cardId, idx) {
    const key = `${cardId}-${idx}`;
    setKeep((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function submit() {
    setBusy(true);
    const keepCardIds = keep.map((k) => k.slice(0, k.lastIndexOf('-')));
    await emit('card:resolveOverflow', { keepCardIds });
    setBusy(false);
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.title}>มือเต็มแล้ว เลือก 3 ใบที่จะเก็บ ({keep.length}/3)</p>
      <div className={styles.hand}>
        {candidates.map((cardId, idx) => (
          <Card
            key={`${cardId}-${idx}`}
            card={ACTION_CARDS[cardId]}
            size="sm"
            selected={keep.includes(`${cardId}-${idx}`)}
            onClick={() => toggle(cardId, idx)}
            onViewDetails={(card) => setViewingCard(card)}
          />
        ))}
      </div>
      <button disabled={keep.length !== 3 || busy} onClick={submit}>
        ยืนยัน
      </button>
      <CardDetailModal card={viewingCard} onClose={() => setViewingCard(null)} />
    </div>
  );
}
