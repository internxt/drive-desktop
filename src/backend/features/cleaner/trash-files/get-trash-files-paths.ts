import os from 'os';
import path from 'path';
import { TrashFilesPaths } from '../cleaner.types';
/**
 * Get all relevant trash file paths
 */
export function getTrashFilesPaths(): TrashFilesPaths {
  const homeDir = os.homedir();
  const defaultLocalShare = path.join(homeDir, '.local', 'share');
  const xdgDataHome = process.env.XDG_DATA_HOME;

  const paths = {
    localShareTrash: path.join(defaultLocalShare, 'Trash'),
    legacyTrash: path.join(homeDir, '.Trash'),
  };

  if (xdgDataHome && xdgDataHome !== defaultLocalShare) {
    return {
      ...paths,
      xdgDataTrash: path.join(xdgDataHome, 'Trash'),
    };
  }

  return paths;
}
