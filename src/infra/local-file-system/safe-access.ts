import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import { Result } from '../../context/shared/domain/Result';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { isError } from '../../shared/errors/is-error';
type Props = {
  absolutePath: string;
  mode?: number;
};

export async function safeAccess({
  absolutePath,
  mode = constants.R_OK,
}: Props): Promise<Result<void, DriveDesktopError>> {
  try {
    await fs.access(absolutePath, mode);
    return { data: undefined };
  } catch (error) {
    if (isError(error)) {
      const errorCode = (error as NodeJS.ErrnoException).code;
      if (errorCode === 'ENOENT' || errorCode === 'ENOTDIR') {
        return { error: new DriveDesktopError('NOT_EXISTS', error.message) };
      }
      if (errorCode === 'EACCES' || errorCode === 'EPERM') {
        return { error: new DriveDesktopError('ACTION_NOT_PERMITTED', error.message) };
      }
      return { error: new DriveDesktopError('UNKNOWN', error.message) };
    }
    return {
      error: new DriveDesktopError('UNKNOWN', `An unknown error happened when checking access to ${absolutePath}`),
    };
  }
}
