-- Game history / stats only. No user accounts — players identified by nickname per game.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

CREATE TABLE IF NOT EXISTS games (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code        VARCHAR(6) NOT NULL,
  player_count     SMALLINT NOT NULL,
  rounds_played    SMALLINT NOT NULL DEFAULT 0,
  winning_faction  VARCHAR(20), -- village | werewolf | tanner | lovers
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS game_players (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id               UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_name           VARCHAR(20) NOT NULL,
  starting_role         VARCHAR(30) NOT NULL,
  final_role            VARCHAR(30), -- differs from starting_role if Inherit Role used
  faction               VARCHAR(20) NOT NULL, -- village | werewolf | neutral
  survived              BOOLEAN NOT NULL DEFAULT false,
  is_winner             BOOLEAN NOT NULL DEFAULT false,
  died_round            SMALLINT,
  death_cause           VARCHAR(30), -- wolf_kill | day_vote | hunter_revenge | mark_of_death | soul_reap | lover_heartbreak | witch_poison
  became_ghost          BOOLEAN NOT NULL DEFAULT false,
  action_cards_used     JSONB NOT NULL DEFAULT '[]', -- [{ cardId, round }]
  curse_cards_proposed  JSONB NOT NULL DEFAULT '[]'  -- [{ cardId, targetName, round, resolved }]
);

CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_player_name ON game_players(player_name);
CREATE INDEX IF NOT EXISTS idx_games_started_at ON games(started_at);

-- ============================================================
-- Reference / config data — role, action card, curse card definitions
-- Static per DESIGN.md, seeded once. game_players/action_cards_used
-- reference these ids loosely (no FK — cards/roles are read via API, not joined).
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id            VARCHAR(30) PRIMARY KEY,
  name          VARCHAR(50) NOT NULL,
  faction       VARCHAR(20) NOT NULL, -- werewolf | village | neutral
  ability       TEXT NOT NULL,
  trigger_type  VARCHAR(20) NOT NULL, -- night | night_1_only | night_odd | on_death | passive | none
  usage_limit   VARCHAR(50)           -- null = unlimited
);

INSERT INTO roles (id, name, faction, ability, trigger_type, usage_limit) VALUES
('werewolf',    'Werewolf',    'werewolf', 'กลุ่ม wolf vote ร่วมกันเลือก 1 target ฆ่า (majority ภายในกลุ่ม, tie → random/no kill)', 'night', NULL),
('wolf_cub',    'Wolf Cub',    'werewolf', 'ถ้า Wolf Cub ตาย → คืนถัดไป wolf ฆ่าได้ 2 target แทน 1', 'passive', 'trigger ครั้งเดียวตอนตาย'),
('villager',    'Villager',    'village',  'ไม่มี night ability ใช้ vote ตอน day เท่านั้น', 'none', NULL),
('seer',        'Seer',        'village',  'เลือก 1 target ดู faction (Werewolf หรือไม่) เห็นผลเฉพาะตัวเอง', 'night', NULL),
('doctor',      'Doctor',      'village',  'เลือก 1 target save กัน death คืนนั้น ห้าม save คนเดิมซ้ำ 2 คืนติด', 'night', 'คูลดาวน์ 2 คืน/target'),
('witch',       'Witch',       'village',  'Heal potion: save คนที่โดน wolf ฆ่าคืนนั้น / Poison potion: ฆ่า target ใดก็ได้ทันที', 'night', '1 ครั้ง/potion (รวม 2 ครั้ง/game)'),
('hunter',      'Hunter',      'village',  'ตอนตาย (สาเหตุใดก็ได้) เลือก 1 target ยิงตายตามทันที', 'on_death', 'ครั้งเดียวตอนตาย'),
('bodyguard',   'Bodyguard',   'village',  'เลือก 1 target ปกป้อง กัน kill คืนนั้น ห้าม guard คนเดิมซ้ำ 2 คืนติด', 'night', 'คูลดาวน์ 2 คืน/target'),
('cupid',       'Cupid',       'village',  'Night 1 เท่านั้น เลือก 2 คนเป็น Lovers — ถ้าฝ่ายใดตาย อีกฝ่ายตายตาม (heartbreak)', 'night_1_only', 'ครั้งเดียว (คืนแรก)'),
('little_girl', 'Little Girl', 'village',  'คืนคี่เท่านั้น (Night 1,3,5...) แอบดู target ที่ wolf vote เลือกฆ่า', 'night_odd', 'เว้นคืนเว้นคืน'),
('tanner',      'Tanner',      'neutral',  'ไม่มี ability, win แยกถ้าโดนโหวตตาย', 'none', NULL)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS action_cards (
  id          VARCHAR(30) PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,
  category    VARCHAR(20) NOT NULL, -- info | offensive | defensive | social | special
  rarity      VARCHAR(20) NOT NULL, -- common | rare | epic | legendary
  effect      TEXT NOT NULL,
  usable_when VARCHAR(30) NOT NULL  -- any | day | day_vote | night | passive
);

INSERT INTO action_cards (id, name, category, rarity, effect, usable_when) VALUES
('peek_card',     'Peek Card',     'info',       'common',    'ดู card ในมือผู้เล่นอื่น 1 ใบ', 'any'),
('track',         'Track',         'info',       'common',    'ดูว่าเป้าหมาย target ใครคืนนี้', 'night'),
('silence',       'Silence',       'offensive',  'common',    'เป้าหมายพูด chat ไม่ได้ 1 phase', 'day'),
('block_vote',    'Block Vote',    'offensive',  'common',    'vote เป้าหมายไม่นับรอบนี้', 'day_vote'),
('reveal_role',   'Reveal Role',   'info',       'rare',      'บังคับเปิด role เป้าหมายให้ทุกคนเห็น', 'day'),
('redirect_vote', 'Redirect Vote', 'social',     'rare',      'เปลี่ยนเป้าหมาย vote ตัวเองไปคนอื่นโดยเจ้าตัวไม่รู้', 'day_vote'),
('extra_life',    'Extra Life',    'defensive',  'rare',      'กัน death ครั้งเดียว', 'passive'),
('double_vote',   'Double Vote',   'social',     'epic',      'vote 2 เสียงรอบนี้', 'day_vote'),
('mirror_shield', 'Mirror Shield', 'defensive',  'epic',      'สะท้อน card effect ที่โดนใส่ตัวเองกลับไปหาคนใช้', 'passive'),
('inherit_role',  'Inherit Role',  'special',    'legendary', 'เลือก role ของ teammate ฝ่ายเดียวกันที่ตายแล้ว แล้วเปลี่ยนตัวเองเป็น role นั้น', 'any_after_round_3')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS curse_cards (
  id           VARCHAR(30) PRIMARY KEY,
  name         VARCHAR(50) NOT NULL,
  category     VARCHAR(20) NOT NULL, -- info | disrupt | disrupt_aoe | kill_tier
  cost_ratio   NUMERIC(4,2) NOT NULL, -- ratio ของจำนวนผู้เล่น N, cost = ceil(N * ratio)
  effect       TEXT NOT NULL,
  usage_limit  VARCHAR(30)            -- null = unlimited, '1_per_game' etc
);

INSERT INTO curse_cards (id, name, category, cost_ratio, effect, usage_limit) VALUES
('whisper',                  'Whisper',                  'info',        0.10, 'ส่ง message ลึกลับ (fake clue) ให้เป้าหมายเห็นคนเดียว', NULL),
('silence',                  'Silence',                  'disrupt',     0.20, 'เป้าหมายพูด chat ไม่ได้ 1 phase', NULL),
('reveal_role',              'Reveal Role',              'info',        0.30, 'เปิด role เป้าหมายให้ทุกคนเห็น', NULL),
('nightmare',                'Nightmare',                'disrupt',     0.30, 'เป้าหมาย vote ไม่ได้ 1 round', NULL),
('chill',                    'Chill',                    'disrupt_aoe', 0.40, 'ซ่อน vote ทุกคนที่มีชีวิต ไม่ให้เห็นใครโหวตใคร รอบนี้ (ผลโหวตยังนับปกติ)', NULL),
('weaken',                   'Weaken',                   'disrupt',     0.40, 'บล็อก role ability เป้าหมาย 1 คืน', NULL),
('false_accusation',         'False Accusation',         'disrupt_aoe', 0.45, 'บังคับระบบแสดง vote ปลอมของทุกคนที่มีชีวิต ตามที่ผีกำหนด', '1_per_game'),
('mark_of_death',            'Mark of Death',            'kill_tier',   0.40, 'เป้าหมายตาย night ถัดไปถ้าไม่มี protect', NULL),
('curse_of_silence_council', 'Curse of Silence Council', 'disrupt',     0.50, 'บล็อก vote ทั้งโต๊ะ ไม่นับ 1 รอบ (mass disrupt)', '1_per_game'),
('soul_reap',                'Soul Reap',                'kill_tier',   0.65, 'ฆ่าเป้าหมายทันที ข้าม protect ปกติ', '1_per_game')
ON CONFLICT (id) DO NOTHING;

-- Player-facing flavor text (lobby title, phase labels, win/death/curse
-- messages) — admin-editable. backend/src/admin/uiStringDefaults.js is the
-- source of truth (it also auto-inserts any new key added there later);
-- this INSERT just keeps a fresh DB usable without waiting for server boot.
CREATE TABLE IF NOT EXISTS ui_strings (
  key   VARCHAR(60) PRIMARY KEY,
  text  TEXT NOT NULL
);

INSERT INTO ui_strings (key, text) VALUES
('lobby.title',    'WEREWOLF'),
('lobby.subtitle', 'ONLINE — สาปเมือง สาปคน'),

('phase.night', 'กลางคืน'),
('phase.day',   'กลางวัน'),
('phase.ended', 'จบเกม'),

('win.village',  'ฝ่าย Village ชนะ'),
('win.werewolf', 'ฝ่าย Werewolf ชนะ'),
('win.tanner',   'Tanner ชนะเดี่ยว'),
('win.lovers',   'Lovers ชนะร่วมกัน'),

('death.wolf_kill',        'โดน Werewolf ฆ่า'),
('death.wolf_kill_bonus',  'โดน Werewolf ฆ่า (Wolf Cub bonus)'),
('death.witch_poison',     'โดนยาพิษของ Witch'),
('death.day_vote',         'ถูกโหวตประหาร'),
('death.hunter_revenge',   'โดน Hunter ยิงแก้แค้น'),
('death.lover_heartbreak', 'ตายตามคู่รัก (Heartbreak)'),
('death.mark_of_death',    'โดนคำสาป Mark of Death'),
('death.soul_reap',        'โดนคำสาป Soul Reap'),

('curse.silence',                  '{name} พูด chat ไม่ได้รอบนี้ (Silence)'),
('curse.reveal_role',              '{name} ถูกเปิดเผย role: {role}'),
('curse.nightmare',                '{name} vote ไม่ได้รอบนี้ (Nightmare)'),
('curse.chill',                    'Vote รอบนี้ถูกซ่อน ไม่เห็นใครโหวตใคร (Chill)'),
('curse.weaken',                   '{name} ใช้ ability คืนถัดไปไม่ได้ (Weaken)'),
('curse.false_accusation',         'ระบบแสดง vote ปลอมทั้งโต๊ะ (False Accusation)'),
('curse.mark_of_death',            '{name} จะตายคืนถัดไปถ้าไม่มี protect (Mark of Death)'),
('curse.curse_of_silence_council', 'Vote ทั้งโต๊ะถูกบล็อกรอบนี้ (Curse of Silence Council)'),
('curse.soul_reap',                '{name} ถูกฆ่าทันทีข้าม protect (Soul Reap)')
ON CONFLICT (key) DO NOTHING;
