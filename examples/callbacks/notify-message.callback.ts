import { logger } from 'examples/drive';

export const notifyMessageCallback = (message: string, action: string, errorName: string, callback: (response: boolean) => void) => {
  logger.debug({ msg: 'notifyMessageCallback', message, action, errorName });
  callback(true);
};
