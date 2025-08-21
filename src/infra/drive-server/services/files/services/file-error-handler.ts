import { FileError } from '../file.error';
import { Response } from 'electron-fetch';

export function errorHandler(response: Response): { error: FileError } {
  if (response.status === 409) {
    return {
      error: new FileError('FILE_ALREADY_EXISTS'),
    };
  }
  if (response.status >= 500) {
    return {
      error: new FileError('SERVER_ERROR'),
    };
  }
  if (response.status === 401 || response.status === 403) {
    return {
      error: new FileError('NO_PERMISSION'),
    };
  }
  if (response.status >= 400) {
    return {
      error: new FileError('BAD_REQUEST'),
    };
  }
  return { error: new FileError('UNKNOWN') };
}
