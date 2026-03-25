import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { open } from 'node:fs/promises';
import { sleep } from '@/apps/main/util';

const SLEEP_MS = 500;
const MAX_WAIT_MS = 60_000;
const MAX_ATTEMPTS = Math.ceil(MAX_WAIT_MS / SLEEP_MS);

type Props = {
  path: AbsolutePath;
};

// The watcher goes faster than windows copying the file, so we may have receive the last `update` event
// from the watcher before the file is fully copied. In that case the file can appear as locked.
// We are going to wait until we can open it.
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
