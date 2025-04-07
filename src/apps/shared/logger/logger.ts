import { inspect } from 'node:util';
import { getUser } from '@/apps/main/auth/service';
import ElectronLog from 'electron-log';
import { paths } from '../HttpClient/schema';

type TTag = 'AUTH' | 'BACKUPS' | 'SYNC-ENGINE' | 'ANTIVIRUS';

export type TLoggerBody = {
  msg: string;
  tag?: TTag;
  exc?: Error | unknown;
  context?: Record<string, unknown>;
  attributes?: {
    userId?: string;
    tag?: TTag;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    endpoint?: keyof paths;
  };
  [key: string]: unknown;
};

export class LoggerService {
  private prepareBody(rawBody: TLoggerBody) {
    const user = getUser();

    rawBody.attributes = {
      userId: user?.uuid,
      tag: rawBody.tag,
      ...rawBody.attributes,
    };

    const { attributes, ...rest } = rawBody;
    const body = inspect(rest, { colors: true, depth: Infinity, breakLength: Infinity });
    return { attributes, body };
  }

  debug(rawBody: TLoggerBody) {
    const { body } = this.prepareBody(rawBody);
    ElectronLog.debug(body);
  }

  info(rawBody: TLoggerBody) {
    const { body } = this.prepareBody(rawBody);
    ElectronLog.info(body);
  }

  warn(rawBody: TLoggerBody) {
    const { body } = this.prepareBody(rawBody);
    ElectronLog.warn(body);
    return new Error(rawBody.msg);
  }

  error(rawBody: TLoggerBody) {
    const { body } = this.prepareBody(rawBody);
    ElectronLog.error(body);
    return new Error(rawBody.msg);
  }

  fatal(rawBody: TLoggerBody) {
    const { body } = this.prepareBody(rawBody);
    ElectronLog.error(body);
    return new Error(rawBody.msg);
  }
}

export const logger = new LoggerService();
export const loggerService = logger;
