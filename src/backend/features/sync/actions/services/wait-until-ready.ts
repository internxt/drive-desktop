import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { open } from 'node:fs/promises';
import { sleep } from '@/apps/main/util';
import { fileSystem } from '@/infra/file-system/file-system.module';

const SLEEP_MS = 500;
const DEFAULT_MAX_WAIT_MS = 60_000;

export class WaitUntilReadyError extends Error {
  constructor(public readonly code: 'IDLE_TIMEOUT' | 'MAX_TIMEOUT' | 'NON_EXISTS' | 'ABORTED') {
    super(code);
  }
}

type Props = {
  path: AbsolutePath;
  idleTimeoutMs?: number;
  maxWaitMs?: number;
  abortSignal?: AbortSignal;
};

// The watcher goes faster than windows copying the file, so we may have receive the last `update` event
// from the watcher before the file is fully copied. In that case the file can appear as locked.
// We are going to wait until we can open it.
/**
 * v2.7.0 Victor Fernandez
 * A fixed timeout is not enough for slow copies: a 1 GB file copied at ~3 MB/s takes ~6 minutes and
 * was dropped after 60s. The size cannot tell whether the copy is still running because Windows
 * reserves the final size when the copy starts, but the mtime keeps moving while it writes. With
 * `idleTimeoutMs` we only give up when the file stays locked and its mtime stops changing for that long.
 */
export async function waitUntilReady({ path, idleTimeoutMs, maxWaitMs = DEFAULT_MAX_WAIT_MS, abortSignal }: Props) {
  const maxAttempts = Math.ceil(maxWaitMs / SLEEP_MS);
  const idleAttempts = idleTimeoutMs === undefined ? Infinity : Math.ceil(idleTimeoutMs / SLEEP_MS);
  let lastMtimeMs: number | undefined;
  let attemptsWithoutChanges = 0;

  for (let i = 0; i < maxAttempts; i++) {
    if (abortSignal?.aborted) {
      return { error: new WaitUntilReadyError('ABORTED') };
    }

    try {
      const fd = await open(path, 'r');
      await fd.close();
      return { data: true as const };
    } catch {
      // The file is still locked, keep checking whether it is being written
    }

    const { data: stats, error } = await fileSystem.stat({ absolutePath: path });

    if (error?.code === 'NON_EXISTS') {
      return { error: new WaitUntilReadyError('NON_EXISTS') };
    }

    if (stats && stats.mtimeMs !== lastMtimeMs) {
      lastMtimeMs = stats.mtimeMs;
      attemptsWithoutChanges = 0;
    } else {
      attemptsWithoutChanges++;
    }

    if (attemptsWithoutChanges >= idleAttempts) {
      return { error: new WaitUntilReadyError('IDLE_TIMEOUT') };
    }

    await sleep(SLEEP_MS);
  }

  return { error: new WaitUntilReadyError('MAX_TIMEOUT') };
}
