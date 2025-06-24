import { inspect } from 'node:util';
import { getUser } from '@/apps/main/auth/service';
import ElectronLog from 'electron-log';
import { paths } from '../HttpClient/schema';

type TTag = 'AUTH' | 'BACKUPS' | 'SYNC-ENGINE' | 'ANTIVIRUS' | 'NODE-WIN';
type TLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type TLoggerBody = {
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

function getLevelStr(level: TLevel): string {
  switch (level) {
    case 'debug':
      return ' ';
    case 'warn':
      return 'w';
    case 'error':
      return 'E';
    case 'fatal':
      return 'F';
    case 'info':
      return 'I';
  }
}

function getProcessStr(): string {
  switch (process.type) {
    case 'browser':
      return 'b';
    case 'renderer':
      return 'r';
    case 'worker':
      return 'w';
    case 'utility':
      return 'u';
  }
}

function getTagStr(tag?: TTag): string {
  switch (tag) {
    case 'AUTH':
      return 'auth';
    case 'BACKUPS':
      return 'back';
    case 'SYNC-ENGINE':
      return 'sync';
    case 'ANTIVIRUS':
      return 'anti';
    case 'NODE-WIN':
      return 'sync';
    default:
      return '    ';
  }
}

export class LoggerService {
  private prepareBody(level: TLevel, rawBody: TLoggerBody) {
    const user = getUser();

    const { tag, msg, workspaceId, ...rest1 } = rawBody;

    const header = `${getLevelStr(level)} - ${getProcessStr()} - ${getTagStr(tag)}`;

    rawBody = {
      header,
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
    return new Error(rawBody.msg, { cause: rawBody.exc });
  }

  info(rawBody: TLoggerBody) {
    const { body } = this.prepareBody('info', rawBody);
    ElectronLog.debug(body);
    ElectronLog.info(body);
    return new Error(rawBody.msg, { cause: rawBody.exc });
  }

  warn(rawBody: TLoggerBody) {
    const { body } = this.prepareBody('warn', rawBody);
    ElectronLog.debug(body);
    return new Error(rawBody.msg, { cause: rawBody.exc });
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
