import { app } from 'electron';
import { join } from 'path';

const HOME_FOLDER_PATH = app.getPath('home');
const SQLITE_DB = join(app.getPath('appData'), 'internxt-drive', 'internxt_desktop.db');
const CHECKPOINTS_DB = join(app.getPath('appData'), 'internxt-drive', 'checkpoints.json');
const LOGS = join(app.getPath('appData'), 'internxt-drive', 'logs');
const ELECTRON_LOGS = join(LOGS, 'drive-desktop.ans');
const ELECTRON_IMPORTANT_LOGS = join(LOGS, 'drive-desktop-important.ans');

export const PATHS = { HOME_FOLDER_PATH, SQLITE_DB, CHECKPOINTS_DB, LOGS, ELECTRON_LOGS, ELECTRON_IMPORTANT_LOGS };
