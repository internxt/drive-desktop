import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';
import { components } from './../../../../schemas.d';
import { Result } from './../../../../../context/shared/domain/Result';
import fetch from 'electron-fetch';
import { FileError } from '../file.error';
import { errorHandler } from './file-error-handler';
import { getNewApiHeadersIPC } from '../../../../ipc/get-new-api-headers-ipc';
import { mapError } from '../../utils/mapError';

export async function createFile(
  body: components['schemas']['CreateFileDto'],
): Promise<Result<components['schemas']['FileDto'], FileError>> {
  try {
    const headers = await getNewApiHeadersIPC();
    const response = await fetch(`${process.env.NEW_DRIVE_URL}/files`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data: components['schemas']['FileDto'] = await response.json();
      return { data };
    }

    return errorHandler(response);
  } catch (error) {
    const mappedError = mapError(error);
    logger.error({
      msg: 'error creating a file',
      error: mappedError.message,
    });
    return {
      error: new FileError('UNKNOWN'),
    };
  }
}
