import { logger } from '@/apps/shared/logger/logger';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

type TProps = {
  path: string;
  name: string;
};

export function validateWindowsName({ path, name }: TProps) {
  /**
   * v2.5.3 Daniel Jiménez
   * These characters are invalid in windows paths.
   */
  const forbiddenPattern = /[<>:"/\\|?*]/;
  const isValid = !forbiddenPattern.test(name);

  if (!isValid) {
    logger.debug({
      msg: 'Invalid windows name',
      path,
    });

    ipcRendererSyncEngine.send('ADD_ISSUE', {
      tab: 'sync',
      name: path,
      error: 'INVALID_WINDOWS_NAME',
    });
  }

  return { isValid };
}
