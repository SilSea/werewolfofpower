// Mirrors backend/src/admin/uiStringDefaults.js — admin-editable flavor
// text (lobby title, phase/win labels, death & curse recap messages).
export const UI_STRINGS = {
  'lobby.title': 'WEREWOLF',
  'lobby.subtitle': 'ONLINE — สาปเมือง สาปคน',

  'phase.night': 'กลางคืน',
  'phase.day': 'กลางวัน',
  'phase.ended': 'จบเกม',

  'win.village': 'ฝ่าย Village ชนะ',
  'win.werewolf': 'ฝ่าย Werewolf ชนะ',
  'win.tanner': 'Tanner ชนะเดี่ยว',
  'win.lovers': 'Lovers ชนะร่วมกัน',

  'death.wolf_kill': 'โดน Werewolf ฆ่า',
  'death.wolf_kill_bonus': 'โดน Werewolf ฆ่า (Wolf Cub bonus)',
  'death.witch_poison': 'โดนยาพิษของ Witch',
  'death.day_vote': 'ถูกโหวตประหาร',
  'death.hunter_revenge': 'โดน Hunter ยิงแก้แค้น',
  'death.lover_heartbreak': 'ตายตามคู่รัก (Heartbreak)',
  'death.mark_of_death': 'โดนคำสาป Mark of Death',
  'death.soul_reap': 'โดนคำสาป Soul Reap',

  'curse.silence': '{name} พูด chat ไม่ได้รอบนี้ (Silence)',
  'curse.reveal_role': '{name} ถูกเปิดเผย role: {role}',
  'curse.nightmare': '{name} vote ไม่ได้รอบนี้ (Nightmare)',
  'curse.chill': 'Vote รอบนี้ถูกซ่อน ไม่เห็นใครโหวตใคร (Chill)',
  'curse.weaken': '{name} ใช้ ability คืนถัดไปไม่ได้ (Weaken)',
  'curse.false_accusation': 'ระบบแสดง vote ปลอมทั้งโต๊ะ (False Accusation)',
  'curse.mark_of_death': '{name} จะตายคืนถัดไปถ้าไม่มี protect (Mark of Death)',
  'curse.curse_of_silence_council': 'Vote ทั้งโต๊ะถูกบล็อกรอบนี้ (Curse of Silence Council)',
  'curse.soul_reap': '{name} ถูกฆ่าทันทีข้าม protect (Soul Reap)',
};

export function uiText(key, vars = {}) {
  let text = UI_STRINGS[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, v ?? '');
  }
  return text;
}
