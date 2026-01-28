import { SyncContext } from '@/apps/sync-engine/config';
import { FetchDataFn } from './addon';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fetchData } from '@/apps/sync-engine/callbacks/fetchData.service';
import { logger } from '@internxt/drive-desktop-core/build/backend';

const ctxs = new Map<bigint, SyncContext>();

export function getDriveContexts() {
  return Array.from(ctxs.values());
}

export function addConnectionKey(connectionKey: bigint, ctx: SyncContext) {
  ctxs.set(connectionKey, ctx);
}

export const fetchDataFn: FetchDataFn = async (connectionKey, win32Path, callback) => {
  const ctx = ctxs.get(connectionKey);
  const path = abs(win32Path);

  if (ctx) {
    ctx.logger.debug({ msg: 'Fetch data callback', path });
    await fetchData({ ctx, path, callback });
  } else {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Cannot obtain context in fetch data',
      connectionKey,
      path,
    });
  }
};
