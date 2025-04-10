import { PATHS } from '@/core/electron/paths';
import { ipcMain, shell } from 'electron';
import log from 'electron-log';

log.initialize();

log.transports.file.maxSize = 150 * 1024 * 1024; // 150MB
log.transports.console.format = '[{iso}] [{level}] {text}';

if (process.env.NODE_ENV !== 'development') {
  log.transports.file.level = 'info';
  log.transports.console.level = 'error';
} else {
  log.transports.file.level = 'silly';
  log.transports.console.level = 'silly';
}

// Handle open logs

ipcMain.on('open-logs', () => {
  shell.openPath(PATHS.LOGS);
});
