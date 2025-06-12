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

  ElectronLog.transports.file.maxSize = 150 * 1024 * 1024; // 150MB
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
