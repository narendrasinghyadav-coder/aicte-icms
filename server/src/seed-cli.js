// Node entry point for the demo-data generator: `npm run seed` recreates server/data/icms.db.
import fs from 'node:fs';
import path from 'node:path';
import { openDb, DB_PATH, UPLOAD_DIR, DATA_DIR } from './db.js';
import { hashPassword } from './auth.js';
import { seedDatabase } from './seed.js';

export function seed() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch {}

  for (const f of [DB_PATH, DB_PATH + '-wal', DB_PATH + '-shm']) {
    try { fs.rmSync(f, { force: true }); } catch {}
  }

  if (fs.existsSync(UPLOAD_DIR)) {
    try {
      for (const f of fs.readdirSync(UPLOAD_DIR)) {
        if (f !== '.gitkeep') {
          try { fs.rmSync(path.join(UPLOAD_DIR, f), { force: true }); } catch {}
        }
      }
    } catch {}
  }

  const db = openDb();
  seedDatabase(db, {
    hashPassword,
    saveDocument: (name, bytes) => {
      try {
        fs.writeFileSync(path.join(UPLOAD_DIR, name), bytes);
      } catch (err) {
        console.warn('Could not write document to disk:', err.message);
      }
    },
    log: console.log,
  });
  console.log(`  database: ${DB_PATH}`);
  db.close();
}

if (import.meta.url === `file://${process.argv[1]}`) seed();
