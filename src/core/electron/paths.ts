import { app } from 'electron';
import { join } from 'node:path/posix';

const HOME_FOLDER_PATH = app.getPath('home');
const INTERNXT = join(app.getPath('appData'), 'internxt-drive');
const SQLITE_DB = join(INTERNXT, 'internxt_desktop.db');
const LOKIJS_DB = join(INTERNXT, 'internxt_desktop.json');
const LOGS = join(INTERNXT, 'logs');

export const PATHS = {
  HOME_FOLDER_PATH,
  INTERNXT,
  SQLITE_DB,
  LOKIJS_DB,
  LOGS,
};
