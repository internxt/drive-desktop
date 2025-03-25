import { inspect } from 'node:util';
import { getUser } from '@/apps/main/auth/service';
import ElectronLog from 'electron-log';
import { paths } from '../HttpClient/schema';

export type TRawBody = {
  msg: string;
  exc?: Error | unknown;
  context?: Record<string, unknown>;
  attributes?: {
    tag?: 'AUTH' | 'BACKUPS' | 'SYNC-ENGINE';
    userId?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    endpoint?: keyof paths;
  };
  [key: string]: unknown;
};

export class LoggerService {
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
    return new Error(rawBody.msg);
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

export const logger = new LoggerService();
export const loggerService = logger;
