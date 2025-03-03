import log from 'electron-log';

log.transports.file.level =
  process.env.NODE_ENV === 'development' ? 'silly' : 'info';
log.transports.console.level =
  process.env.NODE_ENV === 'development' ? 'silly' : 'error';

log.transports.console.format = '[{iso}] [{level}] {text}';

/**
 * Logger for the renderer process.
 * This ensures logs from the renderer are captured in the renderer.log file.
 */
export default log;
