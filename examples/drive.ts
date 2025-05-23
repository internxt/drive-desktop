import VirtualDrive from '@/node-win/virtual-drive';

import settings from './settings';
import { TBody } from '@/node-win/logger';

export const logger = {
  debug(body: TBody) {
    console.debug(body);
  },
  info(body: TBody) {
    console.info(body);
  },
  warn(body: TBody) {
    console.warn(body);
  },
  error(body: TBody) {
    console.error(body);
  },
};

export const drive = new VirtualDrive({
  syncRootPath: settings.syncRootPath,
  providerId: settings.providerid,
  loggerPath: settings.defaultLogPath,
  logger,
});
