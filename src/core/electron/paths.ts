import { app } from 'electron';
import { join } from 'node:path';

const HOME_FOLDER_PATH = app.getPath('home');
const SQLITE_DB = join(app.getPath('appData'), 'internxt-drive', 'internxt_desktop.db');
const LOKIJS_DB = join(app.getPath('appData'), 'internxt-drive', 'internxt_desktop.json');
const LOGS = join(app.getPath('appData'), 'internxt-drive', 'logs');

export const PATHS = {
  HOME_FOLDER_PATH,
  SQLITE_DB,
  LOKIJS_DB,
  LOGS,
};
