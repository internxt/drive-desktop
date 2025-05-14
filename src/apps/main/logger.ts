import { PATHS } from '@/core/electron/paths';
import { ipcMain, shell } from 'electron';
import ElectronLog from 'electron-log';

export function setupElectronLog() {
  ElectronLog.initialize();

  ElectronLog.transports.file.resolvePathFn = (_, message) => {
    if (message?.level === 'info' || message?.level === 'error') {
      return PATHS.ELECTRON_IMPORTANT_LOGS;
    } else {
      return PATHS.ELECTRON_LOGS;
    }
  };

  ElectronLog.transports.file.maxSize = 150 * 1024 * 1024; // 150MB
  ElectronLog.transports.file.format = '[{iso}] {text}';
  ElectronLog.transports.console.format = '[{iso}] {text}';
  ElectronLog.transports.console.writeFn = ({ message }) => {
    if (message.level === 'debug') {
      // eslint-disable-next-line no-console
      console.log(`${message.data}`);
    }
  };

  ipcMain.on('open-logs', () => {
    void shell.openPath(PATHS.LOGS);
  });
}
