import * as path from 'path';
import Logger from 'electron-log';

export const isTemporaryFile = async (filePath: string): Promise<boolean> => {
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

    // if start with $Recycle.Bin
    if (filePath.includes('$Recycle.Bin')) {
      Logger.debug(`File ${filePath} is in Recycle Bin`);
      return true;
    }
    return false;
  } catch (error) {
    Logger.error(`Failed to check if the file is temporary: ${error}`);
    return false;
  }
};
