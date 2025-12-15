import { components } from '../../../../schemas';
import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';
import { Result } from '../../../../../context/shared/domain/Result';
import fetch from 'electron-fetch';
import { getNewApiHeadersIPC } from '../../../../ipc/get-new-api-headers-ipc';
import { mapError } from '../../utils/mapError';

export async function updateBackupFolderName(
  folderUuid: string,
  newFolderName: string,
): Promise<Result<components['schemas']['FolderDto'], Error>> {
  try {
    const headers = await getNewApiHeadersIPC();
    const response = await fetch(`${process.env.NEW_DRIVE_URL}/folders/${folderUuid}/meta`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        plainName: newFolderName,
      }),
    });
    if (!response.ok) {
      return {
        error: logger.error({
          tag: 'BACKUPS',
          msg: 'Failed to update backup folder name',
          error: response,
        }),
      };
    }
    const data: components['schemas']['FolderDto'] = await response.json();
    return { data };
  } catch (error) {
    const mappedError = mapError(error);
    const err = logger.error({
      tag: 'BACKUPS',
      msg: 'Error updating backup folder name',
      error: mappedError.message,
    });
    return { error: err };
  }
}
