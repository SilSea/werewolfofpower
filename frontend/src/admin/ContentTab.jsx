import { useEffect, useState } from 'react';
import { emit } from '../socket.js';
import { cardImageUrl } from '../data/imageUrl.js';
import { getAssetVersion } from '../data/contentSync.js';
import styles from './ContentTab.module.css';

const TYPE_FOLDER = { role: 'roles', action_card: 'action', curse_card: 'curse' };

function convertToPngDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('IMAGE_DECODE_FAILED'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
    reader.readAsDataURL(file);
  });
}

function ImageUpload({ type, id, onUploaded }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const dataUrl = await convertToPngDataUrl(file);
      const res = await emit('admin:uploadImage', { type, id, dataUrl });
      if (res.ok) {
        setVersion((v) => v + 1);
        onUploaded?.();
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  const folder = TYPE_FOLDER[type];
  const src = `${cardImageUrl(folder, id)}?v=${getAssetVersion()}-${version}`;

  return (
    <div className={styles.imageUpload}>
      <img
        src={src}
        alt={id}
        className={styles.thumb}
        onError={(e) => {
          e.target.style.visibility = 'hidden';
        }}
        onLoad={(e) => {
          e.target.style.visibility = 'visible';
        }}
      />
      <label className={styles.uploadButton}>
        {busy ? '...' : 'อัปโหลด'}
        <input type="file" accept="image/*" onChange={handleFile} disabled={busy} hidden />
      </label>
      {error && <span className={styles.errorTag}>{error}</span>}
    </div>
  );
}

function Section({ title, type, entries, textField }) {
  const [drafts, setDrafts] = useState({});
  const [savedId, setSavedId] = useState(null);
  const [errorId, setErrorId] = useState(null);

  function draftFor(id, field, fallback) {
    return drafts[id]?.[field] ?? fallback;
  }

  function setDraft(id, field, value) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function save(id) {
    setErrorId(null);
    const name = draftFor(id, 'name', entries[id].name);
    const description = draftFor(id, 'description', entries[id][textField]);
    const res = await emit('admin:updateContent', { type, id, name, description });
    if (res.ok) {
      setSavedId(id);
      setTimeout(() => setSavedId(null), 1500);
    } else {
      setErrorId(id);
    }
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.rows}>
        {Object.entries(entries).map(([id, data]) => (
          <div key={id} className={styles.row}>
            <ImageUpload type={type} id={id} />
            <span className={styles.id}>{id}</span>
            <input
              className={styles.nameInput}
              value={draftFor(id, 'name', data.name)}
              onChange={(e) => setDraft(id, 'name', e.target.value)}
            />
            <textarea
              className={styles.effectInput}
              value={draftFor(id, 'description', data[textField])}
              onChange={(e) => setDraft(id, 'description', e.target.value)}
              rows={2}
            />
            <button className={styles.saveButton} onClick={() => save(id)}>
              บันทึก
            </button>
            {savedId === id && <span className={styles.saved}>บันทึกแล้ว</span>}
            {errorId === id && <span className={styles.errorTag}>ผิดพลาด</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function UiStringSection({ entries }) {
  const [drafts, setDrafts] = useState({});
  const [savedKey, setSavedKey] = useState(null);
  const [errorKey, setErrorKey] = useState(null);

  async function save(key) {
    setErrorKey(null);
    const text = drafts[key] ?? entries[key];
    const res = await emit('admin:updateUiString', { key, text });
    if (res.ok) {
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 1500);
    } else {
      setErrorKey(key);
    }
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>UI Text (alert / phase / win / death / curse messages)</h2>
      <p className={styles.hint}>{'{name}'} และ {'{role}'} จะถูกแทนที่ด้วยข้อมูลจริงตอนแสดงผล</p>
      <div className={styles.rows}>
        {Object.entries(entries).map(([key, text]) => (
          <div key={key} className={styles.uiRow}>
            <span className={styles.id}>{key}</span>
            <textarea
              className={styles.effectInput}
              value={drafts[key] ?? text}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
              rows={2}
            />
            <button className={styles.saveButton} onClick={() => save(key)}>
              บันทึก
            </button>
            {savedKey === key && <span className={styles.saved}>บันทึกแล้ว</span>}
            {errorKey === key && <span className={styles.errorTag}>ผิดพลาด</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ContentTab() {
  const [catalog, setCatalog] = useState(null);

  useEffect(() => {
    emit('admin:getContent', {}).then((res) => {
      if (res.ok) setCatalog(res.catalog);
    });
  }, []);

  if (!catalog) return <p className={styles.loading}>กำลังโหลด...</p>;

  return (
    <div className={styles.wrap}>
      <Section title="Roles" type="role" entries={catalog.roles} textField="ability" />
      <Section title="Action Cards" type="action_card" entries={catalog.actionCards} textField="effect" />
      <Section title="Curse Cards" type="curse_card" entries={catalog.curseCards} textField="effect" />
      <UiStringSection entries={catalog.uiStrings} />
    </div>
  );
}
