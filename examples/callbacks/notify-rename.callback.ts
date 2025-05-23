import { logger } from 'examples/drive';

export const notifyRenameCallback = (newName: string, fileId: string, callback: (response: boolean) => void) => {
  logger.debug({ msg: 'notifyRenameCallback', newName, fileId });
  callback(true);
};
