import { components } from './../../../../schemas.d';
import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';
import { Result } from '../../../../../context/shared/domain/Result';
import fetch from 'electron-fetch';
import { FileError } from '../file.error';
import { errorHandler } from './file-error-handler';
import { getNewApiHeadersIPC } from '../../../../ipc/get-new-api-headers-ipc';

export async function renameFile({
  plainName,
  type,
  fileUuid,
}: {
  plainName: string;
  type: string;
  fileUuid: string;
}): Promise<Result<components['schemas']['FileDto'], FileError>> {
  try {
    const headers = await getNewApiHeadersIPC();
    const response = await fetch(
      `${process.env.NEW_DRIVE_URL}/files/${fileUuid}/meta`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          plainName,
          type,
        }),
      }
    );
    if (response.ok) {
      const data: components['schemas']['FileDto'] = await response.json();
      return { data };
    }
    return errorHandler(response);
  } catch (error) {
    logger.error({
      msg: 'Error renaming file',
      error,
    });
    return {
      error: new FileError('UNKNOWN'),
    };
  }
}
