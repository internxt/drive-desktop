import { app } from 'electron';
import { join } from 'path';

const HOME_FOLDER_PATH = app.getPath('home');
const SQLITE_DB = join(app.getPath('appData'), 'internxt-drive', 'internxt_desktop.db');
const LOGS = join(app.getPath('appData'), 'internxt-drive', 'logs');
const ELECTRON_LOGS = join(LOGS, 'drive-desktop.ans');
const QUEUE_MANAGER = join(app.getPath('appData'), 'internxt-drive', 'queue-manager.json');

export const PATHS = { HOME_FOLDER_PATH, SQLITE_DB, LOGS, ELECTRON_LOGS, QUEUE_MANAGER };
