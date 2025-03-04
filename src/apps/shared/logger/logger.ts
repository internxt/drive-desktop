import { inspect } from 'node:util';
import { getUser } from '../../main/auth/service';
import ElectronLog from 'electron-log';

type TRawBody = {
  msg: string;
  exc?: Error | unknown;
  attributes?: {
    tag?: 'BACKUPS' | 'SYNC-ENGINE';
    userId?: string;
  };
  [key: string]: unknown;
};

class Logger {
  private prepareBody(rawBody: TRawBody) {
    const user = getUser();

    rawBody.attributes = {
      userId: user?.uuid,
      ...rawBody.attributes,
    };

    const { attributes, ...rest } = rawBody;

    const body = inspect(rest, { colors: true, depth: Infinity, breakLength: Infinity });

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
  }

  fatal(rawBody: TRawBody) {
    const { body } = this.prepareBody(rawBody);
    ElectronLog.error(body);
  }
}

export const logger = new Logger();
