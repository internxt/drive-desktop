import { logger } from '@/apps/shared/logger/logger';
import { app } from 'electron';
import { join } from 'path';

export const PATHS = {
  HOME_FOLDER_PATH: app.getPath('home'),
  SQLITE_DB: join(app.getPath('appData'), 'internxt-drive', 'internxt_desktop.db'),
};

logger.debug({
  msg: 'Paths',
  paths: PATHS,
});
