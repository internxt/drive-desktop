import { logFormatter } from './../../core/utils/log-formatter';
import { ipcMain, shell } from 'electron';
import log from 'electron-log';
import path from 'path';

log.transports.file.maxSize = 1048576 * 150; // 150MB
log.transports.file.format = logFormatter;
log.transports.console.format = logFormatter;

if (process.env.NODE_ENV !== 'development') {
  log.transports.file.level = 'info';
  log.transports.console.level = 'error';
} else {
  log.transports.file.level = 'silly';
  log.transports.console.level = 'silly';
}

// Handle open logs

ipcMain.on('open-logs', () => {
  const logfilePath = log.transports.file.getFile().path;
  const logFolderPath = path.dirname(logfilePath);
  shell.openPath(logFolderPath);
});

// Handle log messages from renderer process
ipcMain.on('log-message', (_event, logData) => {
  const { level, message, params = [] } = logData;

  // Convert back any serialized objects if possible
  const processedParams = params.map((param: unknown) => {
    if (typeof param === 'string') {
      try {
        // Try to parse as JSON, but only if it looks like an object or array
        if (
          (param.startsWith('{') && param.endsWith('}')) ||
          (param.startsWith('[') && param.endsWith(']'))
        ) {
          return JSON.parse(param);
        }
      } catch (e) {
        // If parsing fails, just use the string
      }
    }
    return param;
  });

  // Forward to electron-log with the appropriate level
  switch (level) {
    case 'error':
      log.error(`[Renderer] ${message}`, ...processedParams);
      break;
    case 'warn':
      log.warn(`[Renderer] ${message}`, ...processedParams);
      break;
    case 'info':
      log.info(`[Renderer] ${message}`, ...processedParams);
      break;
    case 'verbose':
      log.verbose(`[Renderer] ${message}`, ...processedParams);
      break;
    case 'debug':
      log.debug(`[Renderer] ${message}`, ...processedParams);
      break;
    case 'silly':
      log.silly(`[Renderer] ${message}`, ...processedParams);
      break;
    default:
      log.info(`[Renderer] ${message}`, ...processedParams);
  }
});

export default log;
