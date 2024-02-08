import { PathLike, accessSync, mkdirSync, constants } from 'fs';
import Logger from 'electron-log';

export function ensureFolderExists(folder: PathLike) {
  try {
    accessSync(folder, constants.F_OK);
  } catch (err) {
    Logger.info(`Folder <${folder}> does not exists, going to  create it`);
    try {
      mkdirSync(folder, { recursive: true });
    } catch (err) {
      Logger.error(`Error creating the folder <${folder}>, ${err}`);
    }

  }
}
