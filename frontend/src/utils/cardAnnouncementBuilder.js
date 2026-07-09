import { ACTION_CARDS } from '../data/actionCards.js';
import { ROLES } from '../data/roles.js';

const FACTION_RARITY = { werewolf: 'epic', village: 'rare', neutral: 'legendary' };

function findName(players, id) {
  return players.find((p) => p.id === id)?.name ?? id;
}

function roleCard(role) {
  const data = ROLES[role];
  if (!data) return null;
  return { ...data, rarity: FACTION_RARITY[data.faction] ?? 'common', effect: data.ability };
}

export function buildCardAnnouncement(cardId, result, players) {
  const card = ACTION_CARDS[cardId];
  const base = { card, title: `ใช้การ์ด: ${card?.name ?? cardId}` };

  switch (cardId) {
    case 'peek_card': {
      const cards = (result.cards ?? []).map((id) => ACTION_CARDS[id]).filter(Boolean);
      return {
        ...base,
        subtitle: cards.length ? 'เห็น card ในมือเป้าหมาย' : 'เป้าหมายไม่มี card ในมือ',
        extraCards: cards,
      };
    }
    case 'track': {
      const targetName = result.target ? findName(players, result.target) : null;
      return { ...base, subtitle: targetName ? `เป้าหมายกำลังเล็ง: ${targetName}` : 'เป้าหมายไม่มี night action คืนนี้' };
    }
    case 'silence':
      return { ...base, subtitle: `${findName(players, result.silencedId)} พูดไม่ได้ 1 phase` };
    case 'block_vote':
      return { ...base, subtitle: `${findName(players, result.blockedId)} vote ไม่นับรอบนี้` };
    case 'reveal_role': {
      const name = findName(players, result.revealedId);
      return { card: roleCard(result.role), title: `${name} ถูกเปิดเผย role!`, subtitle: ROLES[result.role]?.name };
    }
    case 'redirect_vote':
      return {
        ...base,
        subtitle: `${findName(players, result.redirectedId)} vote ถูกเปลี่ยนไปที่ ${findName(players, result.redirectToId)} (เจ้าตัวไม่รู้)`,
      };
    case 'double_vote':
      return { ...base, subtitle: 'คุณจะ vote ได้ 2 เสียงรอบนี้' };
    case 'inherit_role':
      return { card: roleCard(result.newRole), title: `คุณสืบทอด role: ${ROLES[result.newRole]?.name}` };
    default:
      return base;
  }
}
