import { useState } from 'react';
import { socket, emit } from '../../socket.js';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { ROLES } from '../../data/roles.js';
import { CURSE_CARDS } from '../../data/curseCards.js';
import { buildCardAnnouncement } from '../../utils/cardAnnouncementBuilder.js';
import RoleReveal from '../RoleReveal/RoleReveal.jsx';
import MyRoleCard from '../MyRoleCard/MyRoleCard.jsx';
import PhaseTimer from '../PhaseTimer/PhaseTimer.jsx';
import CardAnnouncement from '../CardAnnouncement/CardAnnouncement.jsx';
import NightPanel from '../NightPanel/NightPanel.jsx';
import DayPanel from '../DayPanel/DayPanel.jsx';
import Hand from '../Hand/Hand.jsx';
import SpiritPanel from '../SpiritPanel/SpiritPanel.jsx';
import PlayerRoster from '../PlayerRoster/PlayerRoster.jsx';
import GameLog from '../GameLog/GameLog.jsx';
import HostControls from '../HostControls/HostControls.jsx';
import WinScreen from '../WinScreen/WinScreen.jsx';
import styles from './GameScreen.module.css';

export default function GameScreen({ initialRoom, publicState, myState, showRoleReveal, onDismissRoleReveal, onGameEnded }) {
  const [voteResult, setVoteResult] = useState(null);
  const [log, setLog] = useState([]);
  const [announcement, setAnnouncement] = useState(null);

  useSocketEvent('night:resolved', ({ deadIds, spiritResult, curseResults }) => {
    setVoteResult(null);
    const lines = [];
    lines.push(deadIds.length > 0 ? `กลางคืนมีคนตาย: ${deadIds.length} คน` : 'กลางคืนไม่มีใครตาย');
    if (spiritResult?.resolved) lines.push(`ผีใช้ curse: ${CURSE_CARDS[spiritResult.cardId]?.name}`);
    for (const c of curseResults ?? []) lines.push(`Curse effect: ${CURSE_CARDS[c.cardId]?.name ?? c.cardId}`);
    setLog((prev) => [...prev, ...lines]);
  });

  useSocketEvent('day:resolved', (result) => {
    setVoteResult(result);
    setLog((prev) => [
      ...prev,
      result.blocked ? 'Vote ถูกบล็อกทั้งโต๊ะ' : result.eliminatedId ? 'มีคนถูกโหวตออก' : 'โหวตเสมอ ไม่มีใครออก',
    ]);
  });

  useSocketEvent('card:roleRevealed', ({ revealedId, role }) => {
    const name = publicState.players.find((p) => p.id === revealedId)?.name ?? revealedId;
    setLog((prev) => [...prev, `${name} ถูกเปิดเผย role: ${ROLES[role]?.name ?? role}`]);
    setAnnouncement(buildCardAnnouncement('reveal_role', { revealedId, role }, publicState.players));
  });

  function handleCardPlayed(cardId, result) {
    if (cardId === 'reveal_role') return; // covered by the public card:roleRevealed broadcast
    setAnnouncement(buildCardAnnouncement(cardId, result, publicState.players));
  }

  async function handleReturnToRoom() {
    await emit('game:backToRoom', {});
    onGameEnded?.();
  }

  const isHost = initialRoom.hostId === socket.id;

  return (
    <div className={styles.wrap}>
      {showRoleReveal && myState && <RoleReveal role={myState.role} onDismiss={onDismissRoleReveal} />}
      <CardAnnouncement announcement={announcement} onDismiss={() => setAnnouncement(null)} />
      {publicState.winner && (
        <WinScreen winner={publicState.winner} players={publicState.players} onReturnToRoom={handleReturnToRoom} />
      )}

      <div className={[styles.header, styles[`phase-${publicState.phase}`]].join(' ')}>
        <div className={styles.headerLeft}>
          <span className={styles.phaseIcon}>{publicState.phase === 'night' ? '🌙' : publicState.phase === 'day' ? '☀️' : '🏁'}</span>
          <div>
            <p className={styles.phaseName}>
              {publicState.phase === 'night' ? 'กลางคืน' : publicState.phase === 'day' ? 'กลางวัน' : 'จบเกม'}
            </p>
            <p className={styles.round}>Round {publicState.round}</p>
          </div>
        </div>
        <PhaseTimer phaseEndsAt={publicState.phaseEndsAt} />
        <span className={styles.pool}>👻 {publicState.spiritPool}</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.sidebar}>
          {myState?.role && <MyRoleCard role={myState.role} />}
          <PlayerRoster players={publicState.players} selfId={socket.id} />
          <GameLog entries={log} />
        </div>

        <div className={styles.main}>
          {publicState.phase === 'night' && <NightPanel myState={myState} players={publicState.players} round={publicState.round} />}
          {publicState.phase === 'day' && <DayPanel myState={myState} players={publicState.players} voteResult={voteResult} />}
          <SpiritPanel myState={myState} players={publicState.players} totalPlayers={publicState.players.length} />
          {myState && (
            <Hand
              cards={myState.cards}
              players={publicState.players}
              deadTeammates={myState.deadTeammates}
              pendingCardChoice={myState.pendingCardChoice}
              phase={publicState.phase}
              round={publicState.round}
              onPlayed={handleCardPlayed}
            />
          )}
          <HostControls isHost={isHost} phase={publicState.phase} />
        </div>
      </div>
    </div>
  );
}
