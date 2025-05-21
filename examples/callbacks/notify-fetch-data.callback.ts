import { logger } from 'examples/drive';
import { getInfoItem } from 'examples/info-items-manager';

import { TFetchDataCallback } from '@/node-win/types/callbacks.type';
import { sleep } from '@/apps/main/util';

export const fetchDataCallback = async (id: string, callback: Parameters<TFetchDataCallback>[1]) => {
  logger.debug({ msg: 'fetchDataCallback', id });
  const path = await getInfoItem(id);

  let finish = false;
  while (!finish) {
    const result = await callback(true, path);
    finish = result.finished;
    await sleep(1000);
  }
};
