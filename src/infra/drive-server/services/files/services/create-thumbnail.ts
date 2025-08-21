import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';
import { components } from './../../../../schemas.d';
import { Result } from './../../../../../context/shared/domain/Result';
import fetch from 'electron-fetch';
import { FileError } from '../file.error';
import { errorHandler } from './file-error-handler';
import { getNewApiHeadersIPC } from '../../../../ipc/get-new-api-headers-ipc';

export async function createThumbnail(
  body: components['schemas']['CreateThumbnailDto']
): Promise<Result<components['schemas']['ThumbnailDto'], FileError>> {
  try {
    const headers = await getNewApiHeadersIPC();
    const response = await fetch(
      `${process.env.NEW_DRIVE_URL}/files/thumbnail`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }
    );
    if (response.ok) {
      const data: components['schemas']['ThumbnailDto'] = await response.json();
      return { data };
    }
    return errorHandler(response);
  } catch (error) {
    logger.error({
      msg: 'error creating a thumbnail',
      error,
    });
    return {
      error: new FileError('UNKNOWN'),
    };
  }
}
