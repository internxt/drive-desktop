import { inspect } from 'node:util';
import { getUser } from '@/apps/main/auth/service';
import ElectronLog from 'electron-log';
import { paths } from '../HttpClient/schema';

type TTag = 'AUTH' | 'BACKUPS' | 'SYNC-ENGINE' | 'ANTIVIRUS' | 'NODE-WIN' | 'DEVICE';

export type TLoggerBody = {
  process?: 'main' | 'renderer';
  tag?: TTag;
  msg: string;
  workspaceId?: string;
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
  private prepareBody(level: 'debug' | 'info' | 'warn' | 'error' | 'fatal', rawBody: TLoggerBody) {
    const user = getUser();

    const { tag, msg, workspaceId, ...rest1 } = rawBody;

    rawBody = {
      level,
      process: process.type === 'renderer' ? 'renderer' : 'main',
      ...(tag && { tag }),
      msg,
      ...(workspaceId && { workspaceId }),
      ...rest1,
      attributes: {
        userId: user?.uuid,
        ...(tag && { tag }),
        ...rest1.attributes,
      },
    };

    const { attributes, ...rest2 } = rawBody;
    const body = inspect(rest2, { colors: true, depth: Infinity, breakLength: Infinity });
    return { attributes, body };
  }

  debug(rawBody: TLoggerBody) {
    const { body } = this.prepareBody('debug', rawBody);
    ElectronLog.debug(body);
  }

  info(rawBody: TLoggerBody) {
    const { body } = this.prepareBody('info', rawBody);
    ElectronLog.debug(body);
    ElectronLog.info(body);
  }

  warn(rawBody: TLoggerBody) {
    const { body } = this.prepareBody('warn', rawBody);
    ElectronLog.debug(body);
    return new Error(rawBody.msg);
  }

  error(rawBody: TLoggerBody) {
    const { body } = this.prepareBody('error', rawBody);
    ElectronLog.debug(body);
    ElectronLog.info(body);
    return new Error(rawBody.msg, { cause: rawBody.exc });
  }

  fatal(rawBody: TLoggerBody) {
    const { body } = this.prepareBody('fatal', rawBody);
    ElectronLog.debug(body);
    ElectronLog.info(body);
    return new Error(rawBody.msg, { cause: rawBody.exc });
  }
}

export const logger = new LoggerService();
export const loggerService = logger;
