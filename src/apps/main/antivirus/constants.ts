import path from 'path';
import { app } from 'electron';
import os from 'os';

// ClamAV resources path
export const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'clamAV')
  : path.join(__dirname, '../../../../clamAV');

// ClamAV daemon configuration
export const SERVER_HOST = '127.0.0.1';
export const SERVER_PORT = 3310;
export const DIRECTORY_MODE = 0o755;
export const FILE_MODE = 0o644;

// User-specific directories and files
export const userHomeDir = os.homedir();
export const configDir = path.join(userHomeDir, '.config', 'internxt', 'clamav');
export const logDir = path.join(configDir, 'logs');
export const dbDir = path.join(configDir, 'db');
export const logFilePath = path.join(logDir, 'clamd.log');
export const freshclamLogPath = path.join(logDir, 'freshclam.log');

// ClamAV binary paths
export const clamdPath = path.join(RESOURCES_PATH, '/bin/clamd');
export const freshclamPath = path.join(RESOURCES_PATH, '/bin/freshclam');
// Timeouts and intervals
export const DEFAULT_CLAMD_WAIT_TIMEOUT = 180000; // 3 minutes
export const DEFAULT_CLAMD_CHECK_INTERVAL = 5000; // 5 seconds
