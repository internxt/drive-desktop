import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';
import { Result } from '../../../../../context/shared/domain/Result';
import fetch from 'electron-fetch';
import { FileError } from '../file.error';
import { errorHandler } from './file-error-handler';
import { getNewApiHeadersIPC } from '../../../../ipc/get-new-api-headers-ipc';


export async function moveFile({
  destinationFolder,
  uuid,
}: {
  destinationFolder: string;
  uuid: string;
}): Promise<Result<boolean, FileError>> {
  try {
    const headers = await getNewApiHeadersIPC();

    const response = await fetch(`${process.env.NEW_DRIVE_URL}/files/${uuid}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        destinationFolder,
      }),
    });
    if (response.ok) {
      return { data: true };
    }
    return errorHandler(response);
  } catch (error) {
    logger.error({
      msg: 'Error moving file',
      error,
    });
    return {
      error: new FileError('UNKNOWN'),
    };
  }
}
