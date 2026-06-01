import { Dirent } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { isError } from '../../shared/errors/is-error';
import { Result } from '../../context/shared/domain/Result';

export async function safeReadDir(absolutePath: string): Promise<Result<Array<Dirent>, DriveDesktopError>> {
  try {
    return { data: await readdir(absolutePath, { withFileTypes: true }) };
  } catch (error) {
    if (isError(error)) {
      /**
       * v2.6.0 Alexis Mora
       * We know the error will have a code and specific type as per:
       * https://nodejs.org/api/fs.html#fsstatpath-options-callback
       */
      const errorCode = (error as NodeJS.ErrnoException).code;
      if (errorCode === 'ENOENT' || errorCode === 'ENOTDIR') {
        return { error: new DriveDesktopError('NOT_EXISTS', error.message) };
      }
      if (errorCode === 'EACCES') {
        return { error: new DriveDesktopError('INSUFFICIENT_PERMISSION', error.message) };
      }

      if (errorCode === 'EPERM') {
        return { error: new DriveDesktopError('ACTION_NOT_PERMITTED', error.message) };
      }
      return { error: new DriveDesktopError('UNKNOWN', error.message) };
    }
    return {
      error: new DriveDesktopError('UNKNOWN', `An unknown error happened when reading stats of ${absolutePath}`),
    };
  }
}
