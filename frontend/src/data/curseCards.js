// Mirrors backend/src/game/curseCards.js — display data only.
// Drop artwork into frontend/public/cards/curse/<id>.png.
export const CURSE_CARDS = {
  whisper: {
    name: 'Whisper',
    category: 'info',
    costRatio: 0.10,
    effect: 'ส่ง message ลึกลับ (fake clue) ให้เป้าหมายเห็นคนเดียว',
    image: '/cards/curse/whisper.png',
  },
  silence: {
    name: 'Silence',
    category: 'disrupt',
    costRatio: 0.20,
    effect: 'เป้าหมายพูด chat ไม่ได้ 1 phase',
    image: '/cards/curse/silence.png',
  },
  reveal_role: {
    name: 'Reveal Role',
    category: 'info',
    costRatio: 0.30,
    effect: 'เปิด role เป้าหมายให้ทุกคนเห็น',
    image: '/cards/curse/reveal_role.png',
  },
  nightmare: {
    name: 'Nightmare',
    category: 'disrupt',
    costRatio: 0.30,
    effect: 'เป้าหมาย vote ไม่ได้ 1 round',
    image: '/cards/curse/nightmare.png',
  },
  chill: {
    name: 'Chill',
    category: 'disrupt_aoe',
    costRatio: 0.40,
    effect: 'ซ่อน vote ทุกคนที่มีชีวิต ไม่ให้เห็นใครโหวตใคร รอบนี้',
    image: '/cards/curse/chill.png',
  },
  weaken: {
    name: 'Weaken',
    category: 'disrupt',
    costRatio: 0.40,
    effect: 'บล็อก role ability เป้าหมาย 1 คืน',
    image: '/cards/curse/weaken.png',
  },
  false_accusation: {
    name: 'False Accusation',
    category: 'disrupt_aoe',
    costRatio: 0.60,
    effect: 'บังคับระบบแสดง vote ปลอมของทุกคนที่มีชีวิต ตามที่ผีกำหนด',
    limit: '1 ครั้ง/game',
    image: '/cards/curse/false_accusation.png',
  },
  mark_of_death: {
    name: 'Mark of Death',
    category: 'kill_tier',
    costRatio: 0.60,
    effect: 'เป้าหมายตาย night ถัดไปถ้าไม่มี protect',
    image: '/cards/curse/mark_of_death.png',
  },
  curse_of_silence_council: {
    name: 'Curse of Silence Council',
    category: 'disrupt',
    costRatio: 0.70,
    effect: 'บล็อก vote ทั้งโต๊ะ ไม่นับ 1 รอบ',
    limit: '1 ครั้ง/game',
    image: '/cards/curse/curse_of_silence_council.png',
  },
  soul_reap: {
    name: 'Soul Reap',
    category: 'kill_tier',
    costRatio: 0.90,
    effect: 'ฆ่าเป้าหมายทันที ข้าม protect ปกติ',
    limit: '1 ครั้ง/game',
    image: '/cards/curse/soul_reap.png',
  },
};

export function curseCost(cardId, totalPlayers) {
  const card = CURSE_CARDS[cardId];
  return Math.max(1, Math.ceil(totalPlayers * card.costRatio));
}
