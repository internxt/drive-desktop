import ElectronLog from 'electron-log';

type TRawBody = any;

class Logger {
  debug(rawBody: TRawBody) {
    ElectronLog.debug(rawBody);
  }

  info(rawBody: TRawBody) {
    ElectronLog.info(rawBody);
  }

  warn(rawBody: TRawBody) {
    ElectronLog.warn(rawBody);
  }

  error(rawBody: TRawBody) {
    ElectronLog.error(rawBody);
    return new Error(rawBody.msg);
  }

  fatal(rawBody: TRawBody) {
    ElectronLog.error(rawBody);
    return new Error(rawBody.msg);
  }
}

export const logger = new Logger();
