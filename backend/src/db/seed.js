import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_PATH = join(__dirname, '..', '..', 'db', 'init.sql');

async function seed() {
  const sql = readFileSync(SQL_PATH, 'utf-8');
  await pool.query(sql);
  console.log('db:seed complete');
  await pool.end();
}

seed().catch((err) => {
  console.error('db:seed failed:', err.message);
  process.exit(1);
});
