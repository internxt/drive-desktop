import { PathLike, accessSync, mkdirSync, constants } from 'fs';
import { logger } from '@internxt/drive-desktop-core/build/backend';

export function ensureFolderExists(folder: PathLike) {
  try {
    accessSync(folder, constants.F_OK);
  } catch (err) {
    logger.debug({ msg: `Folder <${folder}> does not exists, going to  create it` });
    try {
      mkdirSync(folder, { recursive: true });
    } catch (err) {
      logger.error({ msg: `Error creating the folder <${folder}>, ${err}` });
    }

  }
}
