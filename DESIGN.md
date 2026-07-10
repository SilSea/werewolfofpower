# Werewolf Online — Game Design Doc

## 1. Overview
Web-based Werewolf (Mafia) game, real-time multiplayer, classic ruleset + extended roles, บวกระบบ Action Card (สุ่มแจกทุกรอบ) และระบบ Vengeful Spirit (ผู้เล่นตายรวมพลังสาปคนเป็น)

## 2. Tech Stack
- **Backend:** Node.js + Express + Socket.io — server-authoritative (state ทั้งหมดอยู่ server กัน cheat)
- **Frontend:** React + Socket.io-client
- **State storage:** in-memory `Map<roomId, GameState>` สำหรับ MVP (Redis ทีหลังถ้าต้อง persist/scale)
- **Deploy:** Render/Railway (backend) + Vercel (frontend)

## 3. Game Flow (phase loop)
```
Lobby → Night → Day (discuss) → Vote → Reveal → loop จนถึง win condition
```
Spirit Phase รันขนานกับ Night phase ทุกรอบ (รายละเอียดหมวด 6)

### 3.0 Voting Mechanic (Among Us style — ไม่มีเสนอชื่อขึ้นเผา)
- ไม่มีขั้น nominate/second ก่อน vote แบบ classic werewolf
- ทุกคน vote พร้อมกัน (simultaneous) เลือก target 1 คน หรือ **Skip** (งดออกเสียง)
- นับคะแนน: ใครโดน vote เยอะสุด (plurality) → ตาย
- **Tie** (คะแนนเท่ากันสูงสุด หลายคน) → ไม่มีใครตายรอบนั้น

## 3.1 Win Condition (classic)
- **Village win:** กำจัด werewolf หมด
- **Werewolf win:** จำนวน werewolf ≥ village ที่เหลือ
- **Tanner win:** ถูก vote ตายเอง (win แยกเดี่ยว ไม่นับฝั่งไหน)

## 4. Roles
- **Werewolf team:** Werewolf, Wolf Cub (optional)
- **Village team:** Villager, Seer, Doctor, Witch, Hunter, Bodyguard, Cupid, Little Girl
- **Neutral:** Tanner

### 4.0 Role pool (host-configurable)
- Werewolf + Villager เป็นพื้นฐานเสมอ ไม่ปิดได้ — wolf count auto scale ตาม N (`max(1, floor(N/4))`)
- ที่เหลือ 9 role (Seer, Doctor, Witch, Hunter, Bodyguard, Cupid, Little Girl, Tanner, Wolf Cub) host toggle เปิด/ปิดได้เองในห้อง ก่อนกด "เริ่มเกม"
- **Default:** Seer, Doctor, Hunter, Bodyguard เปิดอยู่ (fit พอดีที่ N=5 ขั้นต่ำ) — ที่เหลือปิดไว้ก่อน host เปิดเพิ่มเองตามจำนวนผู้เล่น
- Wolf Cub ไม่กิน slot เพิ่ม (แทนที่ werewolf ตัวหนึ่ง ไม่ใช่ role แยก) ส่วน role เดี่ยวอื่นๆ เปิด 1 ตัว = กิน 1 ที่นั่งเสมอ
- ถ้า role ที่เปิดรวมกันเกินจำนวนผู้เล่น → กดเริ่มเกมไม่ได้ (block ทั้ง client-side และ server-side validate) ต้องปิด role บางตัวก่อน

### 4.1 Ability (classic ruleset)

| Role | Trigger | Target rule | Limit |
|---|---|---|---|
| Werewolf | ทุกคืน | กลุ่ม wolf vote ร่วมกันเลือก 1 target ฆ่า (majority ภายในกลุ่ม, tie → random/no kill) | ไม่จำกัด |
| Wolf Cub | passive | ถ้า Wolf Cub ตาย → คืนถัดไป wolf ฆ่าได้ 2 target แทน 1 | trigger ครั้งเดียวตอนตาย |
| Villager | - | ไม่มี night ability ใช้ vote ตอน day เท่านั้น | - |
| Seer | ทุกคืน | เลือก 1 target ดู faction (Werewolf หรือไม่) เห็นผลเฉพาะตัวเอง | ไม่จำกัด |
| Doctor | ทุกคืน | เลือก 1 target save กัน death คืนนั้น ห้าม save คนเดิมซ้ำ 2 คืนติด | ไม่จำกัด (มีคูลดาวน์) |
| Witch | ทุกคืน (เลือกใช้หรือไม่ก็ได้) | **Heal potion:** save คนที่โดน wolf ฆ่าคืนนั้น / **Poison potion:** ฆ่า target ใดก็ได้ทันที | potion ละ 1 ครั้ง/game (รวม 2 ครั้งทั้งเกม) |
| Hunter | ตอนตาย (สาเหตุใดก็ได้) | เลือก 1 target ยิงตายตามทันที | trigger ครั้งเดียวตอนตาย |
| Bodyguard | ทุกคืน | เลือก 1 target ปกป้อง กัน kill คืนนั้น ห้าม guard คนเดิมซ้ำ 2 คืนติด | ไม่จำกัด (มีคูลดาวน์) |
| Cupid | Night 1 เท่านั้น | เลือก 2 คนเป็น **Lovers** — ถ้าฝ่ายใดตาย อีกฝ่ายตายตาม (heartbreak) | ครั้งเดียว (คืนแรก) |
| Little Girl | **คืนคี่เท่านั้น** (Night 1, 3, 5...) ระหว่าง wolf phase | แอบดู target ที่ wolf vote เลือกฆ่า | เว้นคืนเว้นคืน (คืนคู่มองไม่เห็น) — เสี่ยงถูก wolf จับได้ mechanic เพิ่มเติมทีหลัง |
| Tanner | - | ไม่มี ability, win แยกถ้าโดนโหวตตาย | - |

**Lovers win condition (จาก Cupid):** ถ้า Lovers เหลือแค่ 2 คนสุดท้ายในเกม (ไม่ว่าอยู่ฝ่ายเดียวกันหรือคนละฝ่าย) → ทั้งคู่ชนะร่วมกันเอง แทน win condition ปกติของฝ่ายตัวเอง

## 5. Action Card System (สุ่มแจกทุกเช้า)
- แจก card สุ่ม **1 ใบ/คน** ทุกครั้งที่เข้า **Day phase** (หลังประกาศเหตุการณ์กลางคืนเสร็จ)
- **Hand limit 3 ใบ** — ถ้ามือเต็มตอนได้ card ใหม่ ผู้เล่นเลือกเองว่าจะเก็บใบไหน/ทิ้งใบไหน (เลือกได้ทั้งใบเก่ากับใบใหม่)
- ใช้ได้ตามช่วงเวลาที่ card ระบุ
- Rarity-weighted random 4 tier: **Common 55% / Rare 30% / Epic 12% / Legendary 3%**
- ใช้ครั้งเดียวหมด (consume แล้ว discard) เว้น card ระบุ passive
- Pool รวม 10 ใบ ครอบคลุม 4 category: Info, Offensive, Defensive, Social

| Card | Category | Rarity | Effect | ใช้ตอน |
|---|---|---|---|---|
| Peek Card | Info | Common | ดู card ในมือผู้เล่นอื่น 1 ใบ | Any |
| Track | Info | Common | ดูว่าเป้าหมาย target ใครคืนนี้ | Night |
| Silence | Offensive | Common | เป้าหมายพูด chat ไม่ได้ 1 phase | Day |
| Block Vote | Offensive | Common | vote เป้าหมายไม่นับรอบนี้ | Day vote |
| Reveal Role | Info | Rare | บังคับเปิด role เป้าหมายให้ทุกคนเห็น | Day |
| Redirect Vote | Social | Rare | เปลี่ยนเป้าหมาย vote ตัวเองไปคนอื่นโดยเจ้าตัวไม่รู้ | Day vote |
| Extra Life | Defensive | Rare | กัน death ครั้งเดียว | Passive |
| Double Vote | Social | Epic | vote 2 เสียงรอบนี้ | Day vote |
| Mirror Shield | Defensive | Epic | สะท้อน card effect ที่โดนใส่ตัวเองกลับไปหาคนใช้ | Passive |
| **Inherit Role** | Special | **Legendary** | เลือก role ของ teammate ฝ่ายเดียวกันที่**ตายแล้ว** แล้วเปลี่ยนตัวเองเป็น role นั้น | Any (หลัง round 3+) |

### 5.1 Design note
- Common เน้น info/utility เบาๆ — เปลี่ยนแปลง game state น้อย
- Rare เริ่มกระทบ vote/identity โดยตรง
- Epic กระทบโครงสร้างเกม (vote count, deflect effect) — สุ่มยาก (12%)
- **Inherit Role (Legendary):** มีใบเดียวทั้งเกม (unique — ดึงออกจาก pool ถาวรเมื่อมีใครสุ่มได้ ไม่ใช่แค่ consume ต่อคน), เริ่มปรากฏใน pool ได้ตั้งแต่ round 3 เป็นต้นไป, เลือก role ได้เฉพาะของ teammate ฝ่ายเดียวกันที่ตายแล้วเท่านั้น (กันเปลี่ยนข้างเกมพัง + กัน role ซ้ำซ้อนในเกมเดียวกัน)

## 6. Vengeful Spirit System (ผีรวมพลังสาป)

### 6.0 Win Condition (spirit)
- ผีไม่มี win condition แยก — win/lose **ตามฝั่งเดิมของตัวเอง** (village ghost ชนะเมื่อ village ชนะ, wolf ghost ชนะเมื่อ wolf ชนะ)

### 6.1 Point Pool
- Shared pool กลาง ทุกผีใช้ร่วมกัน
- ตาย 1 คน → pool +1 point
- ใช้แล้วหักถาวร ไม่ regenerate เอง เติมได้จากคนตายเพิ่มเท่านั้น

### 6.2 Timing (confirmed)
- Spirit Phase รันขนานกับ Night phase (ไม่บล็อก living players)
- Point จากคนตาย**รอบปัจจุบัน**ใช้ไม่ได้ทันที — pool อัปเดต**หลัง**spirit vote ปิดรอบเสมอ ต้องรอ spirit vote รอบถัดไปถึงใช้ point ก้อนใหม่ได้ (กัน exploit)
- Curse effect ที่ vote ผ่าน → apply ผล**ตอน Day ถัดไป** (ไม่ immediate)

### 6.3 Voting
- ผีเสนอ (propose) card + target ได้
- ผีที่เหลือ vote แบบ **majority** (เสียงข้างมากชนะ)
- Proposal ชนะ ต้อง pool ≥ cost ถึง resolve; ถ้า pool ไม่พอ → **reset ทิ้ง** (ไม่ carry, ต้องเสนอ+vote ใหม่รอบหน้า)
- Tie vote → skip รอบนั้น

### 6.4 Round flow เต็ม
```
Round N:
  Night phase:
    ├─ Living: night actions resolve (deaths เกิดปลายรอบ)
    └─ Spirit: propose/vote curse ด้วย pool point ก่อนหน้า (ไม่รวม deaths รอบนี้)
              → vote ผ่าน + pool พอ → deduct, queue effect
  Night end: deaths finalize → pool += จำนวนคนตายรอบนี้ (พร้อมใช้ Round N+1)
Day phase:
  → ประกาศเหตุการณ์กลางคืน
  → แจก action card สุ่ม 1 ใบ/คน (living players, hand limit 3)
  → apply queued curse effect จาก Round N spirit vote
  → discuss/vote ปกติ (day-vote death ก็ pool += เช่นกัน)
```

### 6.5 Curse Card (ชุดเต็ม 10 ใบ, cost dynamic ตามจำนวน player)

Cost fix ตัวเลขใช้ไม่ได้ทุกห้อง (ห้องเล็ก pool สูงสุดไม่มีวันถึง cost การ์ดแรงๆ) — เปลี่ยนเป็น **cost = ratio ของจำนวนผู้เล่นทั้งหมดตอนเริ่มเกม (N)**

```
cost = ceil(N × ratio)   (ขั้นต่ำ 1)
```

| # | Card | Category | Effect | Ratio | Limit |
|---|---|---|---|---|---|
| 1 | Whisper | Info | ส่ง message ลึกลับ (fake clue) ให้เป้าหมายเห็นคนเดียว | 10% | - |
| 2 | Silence | Disrupt | เป้าหมายพูด chat ไม่ได้ 1 phase | 20% | - |
| 3 | Reveal Role | Info | เปิด role เป้าหมายให้ทุกคนเห็น | 30% | - |
| 4 | Nightmare | Disrupt | เป้าหมาย vote ไม่ได้ 1 round | 30% | - |
| 5 | Chill | Disrupt (AoE) | ซ่อน vote ทุกคนที่มีชีวิต ไม่ให้เห็นใครโหวตใคร รอบนี้ (ผลโหวตยังนับปกติ) | 40% | - |
| 6 | Weaken | Disrupt | บล็อก role ability เป้าหมาย 1 คืน (เช่น seer เช็คไม่ได้, doctor เซฟไม่ได้) | 40% | - |
| 7 | False Accusation | Disrupt (AoE) | บังคับระบบแสดง vote ปลอมของทุกคนที่มีชีวิต ตามที่ผีกำหนด (vote จริงเป็นความลับ) | 45% | 1 ครั้ง/game |
| 8 | Mark of Death | Kill-tier | เป้าหมายตาย night ถัดไปถ้าไม่มี protect | 40% | - |
| 9 | Curse of Silence Council | Disrupt | บล็อก vote ทั้งโต๊ะ ไม่นับ 1 รอบ (mass disrupt) | 50% | 1 ครั้ง/game |
| 10 | Soul Reap | Kill-tier | ฆ่าเป้าหมายทันที ข้าม protect ปกติ | 65% | 1 ครั้ง/game |

**ตัวอย่างคำนวณ cost จริง:**

| Card | N=6 | N=10 | N=15 |
|---|---|---|---|
| Whisper (10%) | 1 | 1 | 2 |
| Silence (20%) | 2 | 2 | 3 |
| Reveal Role / Nightmare (30%) | 2 | 3 | 5 |
| Chill / Weaken / Mark of Death (40%) | 3 | 4 | 6 |
| False Accusation (45%) | 3 | 5 | 7 |
| Curse of Silence Council (50%) | 3 | 5 | 8 |
| Soul Reap (65%) | 4 | 7 | 10 |

Note: ratio เดิม (60-90%) แพงเกินจริง — จาก playtest pool สูงสุดที่ทำได้จริงในเกมห้องเล็ก (N=6) มักไม่เกิน 2-4 point เพราะเกมจบก่อนตายหมด (win condition trigger ก่อนถึง N-1) ปรับ ratio kill-tier/council ลงให้ reachable จริงในห้องเล็กด้วย

### 6.6 Balance guard
- Kill-tier card cost สูง (40-65% ของ N) กันลากเกม early-mid แต่ยัง reachable ได้จริงในห้องเล็ก
- จำกัด Soul Reap ใช้ได้ 1 ครั้ง/game กัน snowball
- AoE card (Chill, False Accusation, Curse of Silence Council) cost สูงกว่า single-target เทียบ effect เดียวกัน เพราะกระทบทั้งโต๊ะ — False Accusation/Council จำกัด 1 ครั้ง/game กันสับสน game state ทั้งเกม
- Spirit Phase ต้อง async ไม่บล็อก living players' phase
- ต้อง cap sudden-kill resolve ไม่เกิน 1 ครั้ง/round กัน edge case pool ล้นตอนคนตายหมด

## 7. Data Model (concept)

```
Room { id, players[], phase, round, settings }
Player { id, socketId, name, role, alive, isGhost, cards[], votedBy[] }
Card { id, type, rarity, effect, usedBy, usedOn, phase }
GameState {
  ...,
  spiritPool: { points: number },
  spiritProposals: [{ id, proposerId, cardId, targetId, votes: [] }]
}
```

## 8. Open questions (ยังไม่ตัดสินใจ)
- ยังไม่มี — design หลักปิดครบทุกจุดแล้ว รอ scaffold code

## 9. Milestone
1. Room/lobby + socket connection + player list
2. Night/Day phase engine + basic roles (Werewolf, Villager, Seer)
3. Vote system + win condition check
4. เพิ่ม role ที่เหลือ (Doctor, Hunter, Cupid, ฯลฯ)
5. Card system: distribution, hand UI, effect resolver
6. Spirit system: pool, proposal/vote resolver, curse effect queue
7. Balance testing + rarity/cost tuning
8. Polish UI/UX, reconnect handling, spectator mode
