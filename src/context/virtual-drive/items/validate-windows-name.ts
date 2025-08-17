import { logger } from '@/apps/shared/logger/logger';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type TProps = {
  path: RelativePath;
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

    ipcRendererSyncEngine.send('ADD_SYNC_ISSUE', {
      name: path,
      error: 'INVALID_WINDOWS_NAME',
    });
  }

  return { isValid };
}
