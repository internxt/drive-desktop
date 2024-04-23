import ElectronLogger from 'electron-log';
import * as Sentry from '@sentry/electron/main';

export abstract class AppLogger {
  constructor(private app: string) {}

  info(...params: Array<any>) {
    ElectronLogger.info(`${this.app}: `, ...params);
  }

  debug(...params: Array<any>) {
    ElectronLogger.debug(`${this.app}: `, ...params);
  }

  warn(...params: Array<any>) {
    ElectronLogger.warn(`${this.app}: `, ...params);
  }

  error(...params: Array<any>) {
    Sentry.captureMessage(params.join(' '));

    ElectronLogger.error(`${this.app}: `, ...params);
  }
}
