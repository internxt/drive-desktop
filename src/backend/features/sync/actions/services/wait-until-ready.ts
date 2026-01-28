import { sleep } from '@/apps/main/util';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { open } from 'node:fs/promises';

const MAX_ATTEMPTS = 20;

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
      await sleep(100);
    }
  }

  return false;
}
