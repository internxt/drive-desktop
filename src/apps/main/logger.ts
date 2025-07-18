import { PATHS } from '@/core/electron/paths';
import { ipcMain, shell } from 'electron';
import ElectronLog from 'electron-log';
import { logFormatter } from '@/core/utils/logFormatter';

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
  ElectronLog.transports.file.format = logFormatter;
  ElectronLog.transports.console.format = logFormatter;
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
