/**
 * One-off: wipe all prep submissions from Vercel Blob (or local data file).
 * Usage: node --env-file=.env.local scripts/clear-prep-data.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { put, get, BlobNotFoundError } from '@vercel/blob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const BLOB_PATH = 'data/prep-submissions.json';
const LOCAL_PATH = join(root, 'data', 'prep-submissions.json');

async function main() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    let count = 0;
    try {
      const result = await get(BLOB_PATH, { access: 'private' });
      if (result?.stream) {
        const text = await new Response(result.stream).text();
        const parsed = JSON.parse(text);
        count = Array.isArray(parsed) ? parsed.length : 0;
      }
    } catch (err) {
      if (!(err instanceof BlobNotFoundError)) throw err;
    }

    await put(BLOB_PATH, JSON.stringify([], null, 2), {
      access: 'private',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    console.log(`Cleared ${count} record(s) from Vercel Blob (${BLOB_PATH}).`);
    return;
  }

  let count = 0;
  try {
    const raw = readFileSync(LOCAL_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    count = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    // file missing
  }

  mkdirSync(dirname(LOCAL_PATH), { recursive: true });
  writeFileSync(LOCAL_PATH, JSON.stringify([], null, 2), 'utf8');
  console.log(`Cleared ${count} record(s) from local file (${LOCAL_PATH}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});