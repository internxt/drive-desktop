import ElectronLog from 'electron-log';
import { paths } from '../HttpClient/schema';

type TRawBody = {
  msg: string;
  exc?: Error | unknown;
  attributes?: {
    tag?: 'AUTH' | 'BACKUPS' | 'SYNC-ENGINE';
    userId?: string;
    endpoint?: keyof paths;
  };
  [key: string]: unknown;
};

class Logger {
  private prepareBody(rawBody: TRawBody) {
    rawBody.attributes = {
      ...rawBody.attributes,
    };

    const { attributes, ...rest } = rawBody;

    const body = rest;

    return { attributes, body };
  }

  debug(rawBody: TRawBody) {
    const { body } = this.prepareBody(rawBody);
    ElectronLog.debug(body);
  }

  info(rawBody: TRawBody) {
    const { body } = this.prepareBody(rawBody);
    ElectronLog.info(body);
  }

  warn(rawBody: TRawBody) {
    const { body } = this.prepareBody(rawBody);
    ElectronLog.warn(body);
  }

  error(rawBody: TRawBody) {
    const { body } = this.prepareBody(rawBody);
    ElectronLog.error(body);
    return new Error(rawBody.msg);
  }

  fatal(rawBody: TRawBody) {
    const { body } = this.prepareBody(rawBody);
    ElectronLog.error(body);
    return new Error(rawBody.msg);
  }
}

export const logger = new Logger();
