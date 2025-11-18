import { abs, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { app } from 'electron';

const HOME_FOLDER_PATH = abs(app.getPath('home'));
const APP_DATA_PATH = abs(app.getPath('appData'));

const INTERNXT = join(APP_DATA_PATH, 'internxt-drive');
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
