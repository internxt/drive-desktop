import { logger } from '@/apps/shared/logger/logger';
import { app } from 'electron';
import { join } from 'path';

const HOME_FOLDER_PATH = app.getPath('home');
const SQLITE_DB = join(app.getPath('appData'), 'internxt-drive', 'internxt_desktop.db');
const LOGS = join(app.getPath('appData'), 'internxt-drive', 'logs');
const WATCHER_LOGS = join(LOGS, 'watcher-win.log');
const NODE_WIN_LOGS = join(LOGS, 'node-win.log');
const QUEUE_MANAGER = join(app.getPath('appData'), 'internxt-drive', 'queue-manager.json');

export const PATHS = { HOME_FOLDER_PATH, SQLITE_DB, LOGS, WATCHER_LOGS, NODE_WIN_LOGS, QUEUE_MANAGER };

logger.debug({
  msg: 'Paths',
  paths: PATHS,
});
