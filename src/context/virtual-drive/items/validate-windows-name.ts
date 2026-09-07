import { addSyncIssue } from '@/apps/main/background-processes/issues';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  path: string;
  name: string;
};

/**
 * v2.5.3 Daniel Jiménez
 * These characters are invalid in windows paths.
 *
 * v2.6.6 Daniel Jiménez
 * Names that start or end with a space are rejected too (BR-1796).
 *
 * BR-2245
 * The rule is not whether we can create the item, but whether the rest of windows can address
 * it afterwards. We create placeholders through `\\?\` paths, which skip the win32 name
 * parsing, so a trailing space or dot is stored verbatim and then explorer, which does parse,
 * looks for the trimmed name and reports that the folder does not exist. That is exactly
 * BR-1796: a folder the user can see and cannot delete. Measured, of the names we were unsure
 * about, only the trailing ones become unaddressable, and control characters fail on creation
 * with EINVAL. A leading space survives win32 parsing, so it no longer makes the name invalid.
 */
// eslint-disable-next-line no-control-regex -- matching control characters is the point: windows refuses them with EINVAL
const forbiddenCharacters = /[<>:"/\\|?*\x00-\x1f]/;
const unaddressableEnding = /[\s.]$/;

export function validateWindowsName({ path, name }: TProps) {
  const isValid = !forbiddenCharacters.test(name) && !unaddressableEnding.test(name);

  if (!isValid) {
    logger.debug({
      msg: 'Invalid windows name',
      path,
    });

    addSyncIssue({ name: path, error: 'INVALID_WINDOWS_NAME' });
  }

  return { isValid };
}
