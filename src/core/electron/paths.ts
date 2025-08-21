import { app } from 'electron';
import { join } from 'path';

const HOME_FOLDER_PATH = app.getPath('home');
const LOGS = join(HOME_FOLDER_PATH, '.config', 'internxt', 'logs');
const ELECTRON_LOGS = join(LOGS, 'drive-desktop-linux.log');
const ELECTRON_IMPORTANT_LOGS = join(LOGS, 'drive-desktop-linux-important.log');

export const PATHS = {
  HOME_FOLDER_PATH,
  LOGS,
  ELECTRON_LOGS,
  ELECTRON_IMPORTANT_LOGS,
};
