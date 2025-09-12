import { app } from 'electron';
import { join } from 'path';

const HOME_FOLDER_PATH = app.getPath('home');
const LOGS = join(HOME_FOLDER_PATH, '.config', 'internxt', 'logs');

export const PATHS = {
  HOME_FOLDER_PATH,
  LOGS,
};
