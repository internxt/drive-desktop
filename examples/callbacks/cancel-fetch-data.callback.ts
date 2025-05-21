import { logger } from 'examples/drive';

export const cancelFetchDataCallback = (fileId: string) => {
  logger.debug({ msg: 'cancelFetchDataCallback', fileId });
};
