import { logger } from '@internxt/drive-desktop-core/build/backend';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export async function verifyHash({ filePath }: { filePath: string }) {
  const data = await readFile(filePath);
  const actual = createHash('sha512').update(data).digest('base64');

  logger.debug({ msg: 'Verifying release hash', actual });

  const url = 'https://github.com/internxt/drive-desktop/releases/latest/download/latest.yml';
  const res = await fetch(url);
  const text = await res.text();

  const match = /^sha512:[ \t]*([A-Za-z0-9+/]{86}==)$/m.exec(text);
  if (!match) throw new Error('sha512 not found in latest.yml');
  const expected = match[1].trim();

  if (actual !== expected) throw new Error(`sha512 mismatch: expected ${expected}, got ${actual}`);
  logger.debug({ msg: 'Release hash verified', actual, expected });
}
