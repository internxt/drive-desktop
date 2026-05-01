import { addSyncIssue } from '@/apps/main/background-processes/issues';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  path: string;
  name: string;
};

export function validateWindowsName({ path, name }: TProps) {
  /**
   * v2.5.3 Daniel Jiménez
   * These characters are invalid in windows paths.
   */
  const forbiddenPattern = /[<>:"/\\|?*]|^\s|\s$/;
  const isValid = !forbiddenPattern.test(name);

  if (!isValid) {
    logger.debug({
      msg: 'Invalid windows name',
      path,
    });

    addSyncIssue({ name: path, error: 'INVALID_WINDOWS_NAME' });
  }

  return { isValid };
}
