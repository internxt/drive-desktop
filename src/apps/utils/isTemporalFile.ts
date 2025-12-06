import * as path from 'node:path';
import { logger } from '../shared/logger/logger';

export const isTemporaryFile = (filePath: string): boolean => {
  try {
    // Check if the file name starts with a common temporary prefix
    if (path.basename(filePath).startsWith('~$')) {
      return true;
    }

    // // Check if the file has common temporary file extensions
    const tempExtensions = ['.tmp', '.temp', '.swp'];
    if (tempExtensions.includes(path.extname(filePath).toLowerCase())) {
      return true;
    }

    return false;
  } catch (error) {
    logger.error({ msg: `Failed to check if the file is temporary`, error });
    return false;
  }
};
