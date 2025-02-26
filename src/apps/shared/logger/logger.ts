import { app } from 'electron';
import { join, resolve } from 'path';
import winston from 'winston';
import { customInspect } from './custom-inspect';

const { format, transports } = winston;

export const createLogger = (path: string) => {
  return winston.createLogger({
    format: format.errors({ stack: true }),
    transports: [
      new transports.File({
        filename: resolve(path),
        format: format.combine(format.timestamp(), format.json()),
      }),
      new transports.Console({
        format: format.combine(
          format.printf(({ level, message, stack }) => {
            const object: { level: string; message: unknown; stack?: unknown } = { level, message };
            if (stack) object.stack = stack;
            return customInspect(object);
          }),
        ),
      }),
    ],
  });
};

export const loggerPath = join(app.getPath('appData'), 'internxt-drive', 'logs', 'watcher-win.txt');
export const logger = createLogger(loggerPath);
