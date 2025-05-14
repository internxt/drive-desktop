import { PATHS } from '@/core/electron/paths';
import { ipcMain, shell } from 'electron';
import ElectronLog from 'electron-log';

export function setupElectronLog() {
  ElectronLog.initialize();

  ElectronLog.transports.file.resolvePathFn = (_, message) => {
    const level = message?.level;
    if (level === 'error' || level === 'info' || level === 'warn') {
      return PATHS.ELECTRON_IMPORTANT_LOGS;
    } else {
      return PATHS.ELECTRON_LOGS;
    }
  };

  ElectronLog.transports.file.maxSize = 150 * 1024 * 1024; // 150MB
  ElectronLog.transports.file.format = '[{iso}] [{level}] {text}';
  ElectronLog.transports.console.format = '[{iso}] [{level}] {text}';

  ipcMain.on('open-logs', () => {
    void shell.openPath(PATHS.LOGS);
  });
}
