// Mirrors backend/src/game/actionCards.js — display data only.
// Artwork is uploaded via the admin panel (Content Editor); Card falls
// back to a placeholder automatically until something is uploaded.
import { cardImageUrl } from './imageUrl.js';

export const ACTION_CARDS = {
  peek_card: {
    name: 'Peek Card',
    category: 'info',
    rarity: 'common',
    effect: 'ดู card ในมือผู้เล่นอื่น 1 ใบ',
    usableWhen: 'any',
    image: cardImageUrl('action', 'peek_card'),
  },
  track: {
    name: 'Track',
    category: 'info',
    rarity: 'common',
    effect: 'ดูว่าเป้าหมาย target ใครคืนนี้',
    usableWhen: 'night',
    image: cardImageUrl('action', 'track'),
  },
  silence: {
    name: 'Silence',
    category: 'offensive',
    rarity: 'common',
    effect: 'เป้าหมายพูด chat ไม่ได้ 1 phase',
    usableWhen: 'day',
    image: cardImageUrl('action', 'silence'),
  },
  block_vote: {
    name: 'Block Vote',
    category: 'offensive',
    rarity: 'common',
    effect: 'vote เป้าหมายไม่นับรอบนี้',
    usableWhen: 'day_vote',
    image: cardImageUrl('action', 'block_vote'),
  },
  reveal_role: {
    name: 'Reveal Role',
    category: 'info',
    rarity: 'rare',
    effect: 'บังคับเปิด role เป้าหมายให้ทุกคนเห็น',
    usableWhen: 'day',
    image: cardImageUrl('action', 'reveal_role'),
  },
  redirect_vote: {
    name: 'Redirect Vote',
    category: 'social',
    rarity: 'rare',
    effect: 'เปลี่ยนเป้าหมาย vote ตัวเองไปคนอื่นโดยเจ้าตัวไม่รู้',
    usableWhen: 'day_vote',
    image: cardImageUrl('action', 'redirect_vote'),
  },
  extra_life: {
    name: 'Extra Life',
    category: 'defensive',
    rarity: 'rare',
    effect: 'กัน death ครั้งเดียว',
    usableWhen: 'passive',
    image: cardImageUrl('action', 'extra_life'),
  },
  double_vote: {
    name: 'Double Vote',
    category: 'social',
    rarity: 'epic',
    effect: 'vote 2 เสียงรอบนี้',
    usableWhen: 'day_vote',
    image: cardImageUrl('action', 'double_vote'),
  },
  mirror_shield: {
    name: 'Mirror Shield',
    category: 'defensive',
    rarity: 'epic',
    effect: 'สะท้อน card effect ที่โดนใส่ตัวเองกลับไปหาคนใช้',
    usableWhen: 'passive',
    image: cardImageUrl('action', 'mirror_shield'),
  },
  inherit_role: {
    name: 'Inherit Role',
    category: 'special',
    rarity: 'legendary',
    effect: 'เลือก role ของ teammate ฝ่ายเดียวกันที่ตายแล้ว แล้วเปลี่ยนตัวเองเป็น role นั้น',
    usableWhen: 'any_after_round_3',
    image: cardImageUrl('action', 'inherit_role'),
  },
};
