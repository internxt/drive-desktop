import { sleep } from '@/apps/main/util';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { open } from 'node:fs/promises';

const SLEEP_MS = 500;
const MAX_WAIT_MS = 60_000;
const MAX_ATTEMPTS = Math.ceil(MAX_WAIT_MS / SLEEP_MS);

type Props = {
  path: AbsolutePath;
};

export async function waitUntilReady({ path }: Props) {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const fd = await open(path, 'r');
      await fd.close();
      return true;
    } catch {
      await sleep(SLEEP_MS);
    }
  }

  return false;
}
