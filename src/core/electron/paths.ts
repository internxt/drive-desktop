import { app } from 'electron';
import path, { join } from 'node:path';
import os from 'node:os';

const HOME_FOLDER_PATH = app.getPath('home');
const APP_DATA_PATH = app.getPath('appData');
const INTERNXT = join(APP_DATA_PATH, 'internxt');
const INTERNXT_DRIVE = join(APP_DATA_PATH, 'internxt-drive');
const LOGS = join(INTERNXT, 'logs');
const DATABASE = join(INTERNXT_DRIVE, 'internxt_desktop.db');
const ROOT_DRIVE_FOLDER = join(HOME_FOLDER_PATH, 'Internxt Drive');
const THUMBNAILS_FOLDER = path.join(os.homedir(), '.cache', 'thumbnails');
const TEMPORAL_FOLDER = app.getPath('temp');
const INTERNXT_DRIVE_TMP = path.join(TEMPORAL_FOLDER, 'internxt-drive-tmp');
const REJECTED_FILES_SIZE_TOO_BIG = join(INTERNXT, 'rejected-files-size-too-big');
const DOWNLOADED = join(INTERNXT, 'downloaded');
const FUSE_DAEMON_LOG = join(LOGS, 'fuse-daemon.log');
const FUSE_DAEMON_SOCKET = join(process.env.XDG_RUNTIME_DIR ?? '/tmp', 'internxt-fuse.sock');
const FUSE_DAEMON_BINARY = app.isPackaged
  ? join(process.resourcesPath, 'dist', 'fuse-daemon')
  : join(__dirname, '../../../dist/fuse-daemon');
const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../../assets');

export const PATHS = {
  HOME_FOLDER_PATH,
  INTERNXT,
  LOGS,
  DATABASE,
  THUMBNAILS_FOLDER,
  TEMPORAL_FOLDER,
  INTERNXT_DRIVE_TMP,
  REJECTED_FILES_SIZE_TOO_BIG,
  ROOT_DRIVE_FOLDER,
  DOWNLOADED,
  FUSE_DAEMON_LOG,
  FUSE_DAEMON_SOCKET,
  FUSE_DAEMON_BINARY,
  RESOURCES_PATH,
};
