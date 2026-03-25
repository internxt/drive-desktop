import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { open } from 'node:fs/promises';
import { sleep } from '@/apps/main/util';

const SLEEP_MS = 500;
const MAX_WAIT_MS = 60_000;
const MAX_ATTEMPTS = Math.ceil(MAX_WAIT_MS / SLEEP_MS);

type Props = {
  path: AbsolutePath;
};

// For some reason, even after we have received the last `update` event from the watcher
// which means that the file is fully copied it can still appear as locked.
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
