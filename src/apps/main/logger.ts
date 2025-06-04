import { PATHS } from '@/core/electron/paths';
import { ipcMain, shell } from 'electron';
import ElectronLog from 'electron-log';

export function setupElectronLog() {
  ElectronLog.initialize();

  ElectronLog.transports.file.resolvePathFn = (_, message) => {
    if (message?.level === 'info') {
      return PATHS.ELECTRON_IMPORTANT_LOGS;
    } else {
      return PATHS.ELECTRON_LOGS;
    }
  };

  /**
   * v2.5.4 Daniel Jiménez
   * Based on this ticket we set the maximum to 1GB.
   * https://inxt.atlassian.net/browse/BR-1244
   */
  ElectronLog.transports.file.maxSize = 1024 * 1024 * 1024;
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
