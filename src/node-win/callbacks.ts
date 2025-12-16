import { SyncContext } from '@/apps/sync-engine/config';
import { CancelFetchDataFn, FetchDataFn } from './addon';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fetchData } from '@/apps/sync-engine/callbacks/fetchData.service';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { LocalSync } from '@/backend/features';

export const ctxs = new Map<bigint, SyncContext>();

export const fetchDataFn: FetchDataFn = async (connectionKey, win32Path, callback) => {
  const ctx = ctxs.get(connectionKey);
  const path = abs(win32Path);

  if (ctx) {
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

export const cancelFetchDataFn: CancelFetchDataFn = (connectionKey, win32Path) => {
  const ctx = ctxs.get(connectionKey);
  const path = abs(win32Path);

  if (ctx) {
    ctx.logger.debug({ msg: 'Cencel fetch data callback', path });
    ctx.contentsDownloader.forceStop({ path });
    LocalSync.SyncState.addItem({ action: 'DOWNLOAD_CANCEL', path });
  } else {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Cannot obtain context in cancel fetch data',
      connectionKey,
      path,
    });
  }
};
