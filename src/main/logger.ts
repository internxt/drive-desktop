import log from 'electron-log';

log.transports.file.maxSize = 1048576 * 150; // 150MB
log.transports.console.format = '[{iso}] [{level}] {text}';

if (process.env.NODE_ENV !== 'development') {
  log.transports.file.level = 'info';
  log.transports.console.level = 'error';
} else {
  log.transports.file.level = 'silly';
  log.transports.console.level = 'silly';
}
