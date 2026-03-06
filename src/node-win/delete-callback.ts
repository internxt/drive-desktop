import { DeleteCallback, Win32Path } from './addon';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { workers } from '@/apps/main/remote-sync/store';
import { onUnlink } from '@/backend/features/local-sync/watcher/events/unlink/on-unlink';

export const timeouts = new Map<Win32Path, NodeJS.Timeout>();

const callOnUnlink: DeleteCallback = (connectionKey, win32Path, isDirectory) => {
  const worker = workers.values().find((w) => w.connectionKey === connectionKey);
  const path = abs(win32Path);

  if (worker) {
    const { ctx } = worker;
    void onUnlink({ ctx, path, isDirectory });
  } else {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Cannot obtain context in delete callback',
      connectionKey,
      isDirectory,
      path,
    });
  }
};

export const deleteCallback: DeleteCallback = (connectionKey, win32Path, isDirectory) => {
  let timeout = timeouts.get(win32Path);

  if (timeout) clearTimeout(timeout);

  timeout = setTimeout(() => {
    timeouts.delete(win32Path);
    callOnUnlink(connectionKey, win32Path, isDirectory);
  }, 1000);

  timeouts.set(win32Path, timeout);
};
