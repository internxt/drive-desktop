import { logger } from '@/apps/shared/logger/logger';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

type TProps = {
  name: string;
  type: 'file' | 'folder';
};

export function validateWindowsName({ name, type }: TProps) {
  /**
   * v2.5.3 Daniel Jiménez
   * These characters are invalid in windows paths.
   */
  const forbiddenPattern = /[<>:"/\\|?*]/;
  const isValid = !forbiddenPattern.test(name);

  if (!isValid) {
    logger.debug({ msg: 'Invalid windows name', name, type });

    ipcRendererSyncEngine.send('SYNC_INFO_UPDATE', {
      kind: 'REMOTE',
      name,
      action: 'DELETE_ERROR',
      errorName: 'BAD_RESPONSE',
      process: 'SYNC',
    });
  }

  return { isValid };
}
