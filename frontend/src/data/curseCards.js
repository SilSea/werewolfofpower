// Mirrors backend/src/game/curseCards.js — display data only.
// Artwork is uploaded via the admin panel (Content Editor).
import { cardImageUrl } from './imageUrl.js';

export const CURSE_CARDS = {
  whisper: {
    name: 'Whisper',
    category: 'info',
    costRatio: 0.10,
    effect: 'ส่ง message ลึกลับ (fake clue) ให้เป้าหมายเห็นคนเดียว',
    image: cardImageUrl('curse', 'whisper'),
  },
  silence: {
    name: 'Silence',
    category: 'disrupt',
    costRatio: 0.20,
    effect: 'เป้าหมายพูด chat ไม่ได้ 1 phase',
    image: cardImageUrl('curse', 'silence'),
  },
  reveal_role: {
    name: 'Reveal Role',
    category: 'info',
    costRatio: 0.30,
    effect: 'เปิด role เป้าหมายให้ทุกคนเห็น',
    image: cardImageUrl('curse', 'reveal_role'),
  },
  nightmare: {
    name: 'Nightmare',
    category: 'disrupt',
    costRatio: 0.30,
    effect: 'เป้าหมาย vote ไม่ได้ 1 round',
    image: cardImageUrl('curse', 'nightmare'),
  },
  chill: {
    name: 'Chill',
    category: 'disrupt_aoe',
    costRatio: 0.40,
    effect: 'ซ่อน vote ทุกคนที่มีชีวิต ไม่ให้เห็นใครโหวตใคร รอบนี้',
    image: cardImageUrl('curse', 'chill'),
  },
  weaken: {
    name: 'Weaken',
    category: 'disrupt',
    costRatio: 0.40,
    effect: 'บล็อก role ability เป้าหมาย 1 คืน',
    image: cardImageUrl('curse', 'weaken'),
  },
  false_accusation: {
    name: 'False Accusation',
    category: 'disrupt_aoe',
    costRatio: 0.45,
    effect: 'บังคับระบบแสดง vote ปลอมของทุกคนที่มีชีวิต ตามที่ผีกำหนด',
    limit: '1 ครั้ง/game',
    image: cardImageUrl('curse', 'false_accusation'),
  },
  mark_of_death: {
    name: 'Mark of Death',
    category: 'kill_tier',
    costRatio: 0.40,
    effect: 'เป้าหมายตาย night ถัดไปถ้าไม่มี protect',
    image: cardImageUrl('curse', 'mark_of_death'),
  },
  curse_of_silence_council: {
    name: 'Curse of Silence Council',
    category: 'disrupt',
    costRatio: 0.50,
    effect: 'บล็อก vote ทั้งโต๊ะ ไม่นับ 1 รอบ',
    limit: '1 ครั้ง/game',
    image: cardImageUrl('curse', 'curse_of_silence_council'),
  },
  soul_reap: {
    name: 'Soul Reap',
    category: 'kill_tier',
    costRatio: 0.65,
    effect: 'ฆ่าเป้าหมายทันที ข้าม protect ปกติ',
    limit: '1 ครั้ง/game',
    image: cardImageUrl('curse', 'soul_reap'),
  },
};

export function curseCost(cardId, totalPlayers) {
  const card = CURSE_CARDS[cardId];
  return Math.max(1, Math.ceil(totalPlayers * card.costRatio));
}
