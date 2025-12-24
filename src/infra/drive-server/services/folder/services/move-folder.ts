import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';
import { Result } from '../../../../../context/shared/domain/Result';
import { FolderDto } from '../../../../../infra/drive-server/out/dto';
import fetch from 'electron-fetch';
import { getNewApiHeadersIPC } from '../../../../ipc/get-new-api-headers-ipc';
import { mapError } from '../../utils/mapError';

export async function moveFolder(uuid: string, destinationFolderUuid: string): Promise<Result<FolderDto, Error>> {
  try {
    const headers = await getNewApiHeadersIPC();

    const response = await fetch(`${process.env.NEW_DRIVE_URL}/folders/${uuid}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        destinationFolder: destinationFolderUuid,
      }),
    });
    if (!response.ok) {
      return {
        error: logger.error({
          msg: 'Failed to move folder',
          error: response,
        }),
      };
    }
    const data: FolderDto = await response.json();
    return { data };
  } catch (error) {
    const mappedError = mapError(error);
    const err = logger.error({
      msg: 'Error moving folder',
      error: mappedError.message,
    });
    return { error: err };
  }
}
