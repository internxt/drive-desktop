import { logger } from 'examples/drive';

export const notifyDeleteCallback = (fileId: string, callback: (response: boolean) => void) => {
  logger.debug({ msg: 'notifyDeleteCallback', fileId });
  callback(true);
};
