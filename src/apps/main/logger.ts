import { PATHS } from '@/core/electron/paths';
import { ipcMain, shell } from 'electron';
import ElectronLog from 'electron-log';

export function setupElectronLog() {
  ElectronLog.initialize();

  ElectronLog.transports.file.resolvePathFn = () => PATHS.ELECTRON_LOGS;
  ElectronLog.transports.file.maxSize = 150 * 1024 * 1024; // 150MB
  ElectronLog.transports.file.format = '[{iso}] {text}';
  ElectronLog.transports.console.format = '[{iso}] {text}';

  ipcMain.on('open-logs', () => {
    shell.openPath(PATHS.LOGS);
  });
}
