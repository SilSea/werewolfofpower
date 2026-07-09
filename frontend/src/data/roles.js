// Mirrors backend/src/game/roles.js — display data only.
// Drop artwork into frontend/public/cards/roles/<id>.png.
export const ROLES = {
  werewolf: {
    name: 'Werewolf',
    faction: 'werewolf',
    ability: 'กลุ่ม wolf vote ร่วมกันเลือก 1 target ฆ่า',
    image: '/cards/roles/werewolf.png',
  },
  wolf_cub: {
    name: 'Wolf Cub',
    faction: 'werewolf',
    ability: 'ถ้าตาย คืนถัดไป wolf ฆ่าได้ 2 target แทน 1',
    image: '/cards/roles/wolf_cub.png',
  },
  villager: {
    name: 'Villager',
    faction: 'village',
    ability: 'ไม่มี night ability ใช้ vote ตอน day เท่านั้น',
    image: '/cards/roles/villager.png',
  },
  seer: {
    name: 'Seer',
    faction: 'village',
    ability: 'เลือก 1 target ดู faction ทุกคืน',
    image: '/cards/roles/seer.png',
  },
  doctor: {
    name: 'Doctor',
    faction: 'village',
    ability: 'เลือก 1 target save กัน death คืนนั้น',
    image: '/cards/roles/doctor.png',
  },
  witch: {
    name: 'Witch',
    faction: 'village',
    ability: 'Heal potion + Poison potion อย่างละ 1 ครั้ง/game',
    image: '/cards/roles/witch.png',
  },
  hunter: {
    name: 'Hunter',
    faction: 'village',
    ability: 'ตอนตาย เลือก 1 target ยิงตายตามทันที',
    image: '/cards/roles/hunter.png',
  },
  bodyguard: {
    name: 'Bodyguard',
    faction: 'village',
    ability: 'เลือก 1 target ปกป้อง กัน kill คืนนั้น',
    image: '/cards/roles/bodyguard.png',
  },
  cupid: {
    name: 'Cupid',
    faction: 'village',
    ability: 'Night 1 เท่านั้น เลือก 2 คนเป็น Lovers',
    image: '/cards/roles/cupid.png',
  },
  little_girl: {
    name: 'Little Girl',
    faction: 'village',
    ability: 'คืนคี่เท่านั้น แอบดู target ที่ wolf เลือกฆ่า',
    image: '/cards/roles/little_girl.png',
  },
  tanner: {
    name: 'Tanner',
    faction: 'neutral',
    ability: 'ไม่มี ability, win แยกถ้าโดนโหวตตาย',
    image: '/cards/roles/tanner.png',
  },
};
