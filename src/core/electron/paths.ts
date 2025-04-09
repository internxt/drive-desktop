import { logger } from '@/apps/shared/logger/logger';
import { app } from 'electron';

export const PATHS = {
  HOME_FOLDER_PATH: app.getPath('home'),
  SQLITE_DB: app.getPath('appData') + '/internxt-drive/internxt_desktop.db',
};

logger.debug({
  msg: 'Paths',
  paths: PATHS,
});
