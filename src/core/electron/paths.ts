import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { app } from 'electron';
import { abs, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getE2EPaths } from '@/tests/e2e/helpers/e2e-configuration.helper';

const e2ePaths = getE2EPaths();

const e2eHomePath = e2ePaths?.e2eHomePath;
const e2eAppDataPath = e2ePaths?.e2eAppDataPath;

const HOME_FOLDER_PATH = (e2eHomePath ?? abs(app.getPath('home'))) as AbsolutePath;
const APP_DATA_PATH = (e2eAppDataPath ?? abs(app.getPath('appData'))) as AbsolutePath;

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
