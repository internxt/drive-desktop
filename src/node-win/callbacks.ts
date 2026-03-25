import { logger } from '@internxt/drive-desktop-core/build/backend';
import { workers } from '@/apps/main/remote-sync/store';
import { fetchData } from '@/apps/sync-engine/callbacks/fetchData.service';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FetchDataCallback } from './addon';

export const fetchDataFn: FetchDataCallback = (connectionKey, win32Path, callback) => {
  const worker = workers.values().find((w) => w.connectionKey === connectionKey);
  const path = abs(win32Path);

  if (worker) {
    const { ctx } = worker;
    ctx.logger.debug({ msg: 'Fetch data callback', path });
    void fetchData({ ctx, path, callback });
  } else {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Cannot obtain context in fetch data',
      connectionKey,
      path,
    });
  }
};
