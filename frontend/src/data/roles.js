// Mirrors backend/src/game/roles.js — display data only.
// Artwork is uploaded via the admin panel (Content Editor).
import { cardImageUrl } from './imageUrl.js';

export const ROLES = {
  werewolf: {
    name: 'Werewolf',
    faction: 'werewolf',
    ability: 'กลุ่ม wolf vote ร่วมกันเลือก 1 target ฆ่า',
    image: cardImageUrl('roles', 'werewolf'),
  },
  wolf_cub: {
    name: 'Wolf Cub',
    faction: 'werewolf',
    ability: 'ถ้าตาย คืนถัดไป wolf ฆ่าได้ 2 target แทน 1',
    image: cardImageUrl('roles', 'wolf_cub'),
  },
  villager: {
    name: 'Villager',
    faction: 'village',
    ability: 'ไม่มี night ability ใช้ vote ตอน day เท่านั้น',
    image: cardImageUrl('roles', 'villager'),
  },
  seer: {
    name: 'Seer',
    faction: 'village',
    ability: 'เลือก 1 target ดู faction ทุกคืน',
    image: cardImageUrl('roles', 'seer'),
  },
  doctor: {
    name: 'Doctor',
    faction: 'village',
    ability: 'เลือก 1 target save กัน death คืนนั้น',
    image: cardImageUrl('roles', 'doctor'),
  },
  witch: {
    name: 'Witch',
    faction: 'village',
    ability: 'Heal potion + Poison potion อย่างละ 1 ครั้ง/game',
    image: cardImageUrl('roles', 'witch'),
  },
  hunter: {
    name: 'Hunter',
    faction: 'village',
    ability: 'ตอนตาย เลือก 1 target ยิงตายตามทันที',
    image: cardImageUrl('roles', 'hunter'),
  },
  bodyguard: {
    name: 'Bodyguard',
    faction: 'village',
    ability: 'เลือก 1 target ปกป้อง กัน kill คืนนั้น',
    image: cardImageUrl('roles', 'bodyguard'),
  },
  cupid: {
    name: 'Cupid',
    faction: 'village',
    ability: 'Night 1 เท่านั้น เลือก 2 คนเป็น Lovers',
    image: cardImageUrl('roles', 'cupid'),
  },
  little_girl: {
    name: 'Little Girl',
    faction: 'village',
    ability: 'คืนคี่เท่านั้น แอบดู target ที่ wolf เลือกฆ่า',
    image: cardImageUrl('roles', 'little_girl'),
  },
  tanner: {
    name: 'Tanner',
    faction: 'neutral',
    ability: 'ไม่มี ability, win แยกถ้าโดนโหวตตาย',
    image: cardImageUrl('roles', 'tanner'),
  },
};
