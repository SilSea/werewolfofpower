import { useState } from 'react';
import { emit } from '../../socket.js';
import styles from './NightPanel.module.css';

function TargetSelect({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

export default function NightPanel({ myState, players, round }) {
  if (!myState?.alive) {
    return <div className={styles.wrap}>คุณตายแล้ว รอผลตอนเช้า</div>;
  }

  const others = players.filter((p) => p.alive && p.id !== myState.id);

  if (myState.faction === 'werewolf') {
    return <WolfVotePanel others={others} />;
  }

  switch (myState.role) {
    case 'seer':
      return <SeerPanel others={others} alreadyChecked={myState.hasCheckedThisRound} />;
    case 'doctor':
      return <ProtectPanel others={others} lastTarget={myState.lastProtectedTarget} event="night:doctorSave" label="เลือกคนที่จะปกป้อง (save)" />;
    case 'bodyguard':
      return <ProtectPanel others={others} lastTarget={myState.lastGuardedTarget} event="night:bodyguardProtect" label="เลือกคนที่จะปกป้อง (guard)" />;
    case 'witch':
      return <WitchPanel others={others} myState={myState} />;
    case 'cupid':
      return round === 1 ? <CupidPanel others={others} /> : <div className={styles.wrap}>ใช้ ability ได้แค่คืนแรกเท่านั้น</div>;
    case 'hunter':
      return <HunterPanel others={others} current={myState.hunterRevengeTarget} />;
    case 'little_girl':
      return round % 2 === 1 ? <LittleGirlPanel players={players} /> : <div className={styles.wrap}>คืนนี้เป็นคืนคู่ — มองไม่เห็น</div>;
    default:
      return <div className={styles.wrap}>ไม่มี night action — รอเช้า</div>;
  }
}

function WolfVotePanel({ others }) {
  const [targetId, setTargetId] = useState('');
  const [done, setDone] = useState(false);

  async function submit() {
    const res = await emit('night:wolfVote', { targetId });
    if (res.ok) setDone(true);
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>เลือกเป้าหมายที่จะฆ่าคืนนี้ (โหวตร่วมกับ wolf คนอื่น)</p>
      <TargetSelect value={targetId} onChange={setTargetId} options={others} placeholder="เลือกเป้าหมาย" />
      <button disabled={!targetId} onClick={submit}>
        ยืนยัน
      </button>
      {done && <p className={styles.confirm}>ส่งโหวตแล้ว</p>}
    </div>
  );
}

function SeerPanel({ others, alreadyChecked }) {
  const [targetId, setTargetId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function check() {
    setError(null);
    const res = await emit('night:seerCheck', { targetId });
    if (res.ok) setResult(res.result);
    else setError(res.error);
  }

  const locked = alreadyChecked || result !== null;

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>เลือกเป้าหมายที่จะตรวจสอบ faction (คืนละ 1 คนเท่านั้น)</p>
      <TargetSelect value={targetId} onChange={setTargetId} options={others} placeholder="เลือกเป้าหมาย" />
      <button disabled={!targetId || locked} onClick={check}>
        {locked ? 'ตรวจไปแล้วคืนนี้' : 'ตรวจสอบ'}
      </button>
      {result && <p className={styles.confirm}>ผล: {result === 'werewolf' ? 'เป็น Werewolf' : 'ไม่ใช่ Werewolf'}</p>}
      {!result && alreadyChecked && <p className={styles.hint}>คุณตรวจไปแล้วคืนนี้ รอคืนหน้า</p>}
      {error && <p className={styles.hint}>{error}</p>}
    </div>
  );
}

function ProtectPanel({ others, lastTarget, event, label }) {
  const [targetId, setTargetId] = useState('');
  const [done, setDone] = useState(false);
  const options = others.filter((p) => p.id !== lastTarget);

  async function submit() {
    const res = await emit(event, { targetId });
    if (res.ok) setDone(true);
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>{label}</p>
      {lastTarget && <p className={styles.hint}>ปกป้องคนเดิมซ้ำ 2 คืนติดไม่ได้</p>}
      <TargetSelect value={targetId} onChange={setTargetId} options={options} placeholder="เลือกเป้าหมาย" />
      <button disabled={!targetId} onClick={submit}>
        ยืนยัน
      </button>
      {done && <p className={styles.confirm}>ส่งแล้ว</p>}
    </div>
  );
}

function WitchPanel({ others, myState }) {
  const [poisonTarget, setPoisonTarget] = useState('');
  const [healDone, setHealDone] = useState(false);
  const [poisonDone, setPoisonDone] = useState(false);

  async function useHeal() {
    const res = await emit('night:witchHeal', {});
    if (res.ok) setHealDone(true);
  }

  async function usePoison() {
    const res = await emit('night:witchPoison', { targetId: poisonTarget });
    if (res.ok) setPoisonDone(true);
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>Heal Potion — ยกเลิก wolf kill คืนนี้</p>
      <button disabled={myState.witchHealUsed || healDone} onClick={useHeal}>
        {myState.witchHealUsed || healDone ? 'ใช้ไปแล้ว' : 'ใช้ Heal Potion'}
      </button>

      <p className={styles.label}>Poison Potion — ฆ่าเป้าหมายทันที</p>
      <TargetSelect value={poisonTarget} onChange={setPoisonTarget} options={others} placeholder="เลือกเป้าหมาย" />
      <button disabled={myState.witchPoisonUsed || poisonDone || !poisonTarget} onClick={usePoison}>
        {myState.witchPoisonUsed || poisonDone ? 'ใช้ไปแล้ว' : 'ใช้ Poison Potion'}
      </button>
    </div>
  );
}

function CupidPanel({ others }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [done, setDone] = useState(false);

  async function submit() {
    const res = await emit('night:cupidLink', { targetId1: a, targetId2: b });
    if (res.ok) setDone(true);
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>เลือก 2 คนเป็น Lovers (คืนแรกเท่านั้น)</p>
      <TargetSelect value={a} onChange={setA} options={others.filter((p) => p.id !== b)} placeholder="คนที่ 1" />
      <TargetSelect value={b} onChange={setB} options={others.filter((p) => p.id !== a)} placeholder="คนที่ 2" />
      <button disabled={!a || !b || a === b} onClick={submit}>
        ยืนยัน
      </button>
      {done && <p className={styles.confirm}>จับคู่แล้ว</p>}
    </div>
  );
}

function HunterPanel({ others, current }) {
  const [targetId, setTargetId] = useState(current ?? '');
  const [done, setDone] = useState(false);

  async function submit() {
    const res = await emit('night:hunterRevengeTarget', { targetId });
    if (res.ok) setDone(true);
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>ตั้งเป้าหมายล้างแค้น (ถ้าคุณตาย จะยิงคนนี้ตามไปด้วย)</p>
      <TargetSelect value={targetId} onChange={setTargetId} options={others} placeholder="เลือกเป้าหมาย" />
      <button disabled={!targetId} onClick={submit}>
        ตั้งเป้าหมาย
      </button>
      {(done || current) && <p className={styles.confirm}>ตั้งไว้แล้ว — เปลี่ยนได้ตลอดที่ยังไม่ตาย</p>}
    </div>
  );
}

function LittleGirlPanel({ players }) {
  const [targetId, setTargetId] = useState(null);

  async function peek() {
    const res = await emit('night:littleGirlPeek', {});
    if (res.ok) setTargetId(res.target);
  }

  const targetPlayer = players.find((p) => p.id === targetId);

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>แอบดู wolf target คืนนี้ (คืนคี่เท่านั้น)</p>
      <button onClick={peek}>แอบดู</button>
      {targetId !== null && (
        <p className={styles.confirm}>{targetPlayer ? `wolf กำลังเล็ง ${targetPlayer.name}` : 'ยังไม่มี wolf เลือกเป้าหมาย'}</p>
      )}
    </div>
  );
}
