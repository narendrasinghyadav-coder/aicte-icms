import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

function resolveDirectory(envValue, relativeFallback, tmpSubDir) {
  // If explicitly provided via environment variable, test or create
  if (envValue) {
    try {
      fs.mkdirSync(envValue, { recursive: true });
      return envValue;
    } catch {
      // If specified path is read-only or invalid, fall through
    }
  }

  // Detect serverless environment (Vercel, AWS Lambda)
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    here.startsWith('/var/task')
  );

  // If not in a serverless environment, attempt to use the local workspace directory
  if (!isServerless) {
    const localDir = path.resolve(here, relativeFallback);
    try {
      fs.mkdirSync(localDir, { recursive: true });
      fs.accessSync(localDir, fs.constants.W_OK);
      return localDir;
    } catch {
      // Local directory is read-only or creation failed; fall through to os.tmpdir()
    }
  }

  // In serverless environments or read-only filesystems, use the OS temporary directory
  const tmpDir = path.join(os.tmpdir(), 'aicte-icms', tmpSubDir);
  try {
    fs.mkdirSync(tmpDir, { recursive: true });
  } catch {
    return os.tmpdir();
  }
  return tmpDir;
}

export const DATA_DIR = resolveDirectory(process.env.DATA_DIR, '../data', 'data');
export const UPLOAD_DIR = resolveDirectory(process.env.UPLOAD_DIR, '../uploads', 'uploads');

export const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'icms.db');

export function openDb(file = DB_PATH) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  } catch {}

  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  return db;
}

export * from './dbutil.js';
