import { inspect } from 'node:util';
import ElectronLog from 'electron-log';
import { paths } from '../../infra/schemas';
import isDev from '../isDev/isDev';


type FeatureTag = 'AUTH' | 'BACKUP'
type HttpMethods = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface LoggerBody {
  msg: string;
  tag?: FeatureTag;
  error?: Error | unknown;
  context?: Record<string, unknown>;
  attributes?: {
    userId?: string;
    method?: HttpMethods
    endpoint?: keyof paths;
  };

  [key: string]: unknown;
}

export class LoggerService {
  debug(rawBody: LoggerBody) {
    if (!isDev()) return;

    const body = this.formatBody(rawBody);
    ElectronLog.debug(body);
  }

  info(rawBody: LoggerBody) {
    const body = this.formatBody(rawBody);
    ElectronLog.info(body);
  }

  warn(rawBody: LoggerBody): void {
    const body = this.formatBody(rawBody);
    ElectronLog.warn(body);
  }

  error(rawBody: LoggerBody): void {
    const body = this.formatBody(rawBody);
    ElectronLog.error(body);
  }

  fatal(rawBody: LoggerBody): void {
    const body = this.formatBody(rawBody);
    ElectronLog.error(body);
  }

  private formatBody(rawBody: LoggerBody): string {
    const tagPrefix = rawBody.tag ? `[${rawBody.tag}] ` : '';
    const message = `${tagPrefix}${rawBody.msg}`;

    const extras: Record<string, unknown> = {};

    if (rawBody.context) {
      extras.context = rawBody.context;
    }

    if (rawBody.error) {
      extras.error = rawBody.error instanceof Error
        ? {
          name: rawBody.error.name,
          message: rawBody.error.message,
          stack: rawBody.error.stack
        }
        : rawBody.error;
    }

    if (rawBody.attributes) {
      extras.attributes = rawBody.attributes;
    }

    if (Object.keys(extras).length === 0) {
      return message;
    }

    const inspected = inspect(extras, {
      colors: false,
      depth: Infinity,
      breakLength: Infinity
    });

    return `${message}\n${inspected}`;
  }
}

export const logger = new LoggerService();
