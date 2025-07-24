import { app } from 'electron';
import { join } from 'path';

const HOME_FOLDER_PATH = app.getPath('home');
const SQLITE_DB = join(app.getPath('appData'), 'internxt-drive', 'internxt_desktop.db');
const LOKIJS_DB = join(app.getPath('appData'), 'internxt-drive', 'internxt_desktop.json');
const LOGS = join(app.getPath('appData'), 'internxt-drive', 'logs');
const ELECTRON_LOGS = join(LOGS, 'drive-desktop.log');
const ELECTRON_IMPORTANT_LOGS = join(LOGS, 'drive-desktop-important.log');

export const PATHS = {
  HOME_FOLDER_PATH,
  SQLITE_DB,
  LOKIJS_DB,
  LOGS,
  ELECTRON_LOGS,
  ELECTRON_IMPORTANT_LOGS,
};
