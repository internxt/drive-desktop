import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';
import { FolderDto } from '../../../../drive-server/out/dto';
import { Result } from './../../../../../context/shared/domain/Result';
import { FolderError } from '../folder.error';
import fetch, { Response } from 'electron-fetch';
import { getNewApiHeadersIPC } from '../../../../ipc/get-new-api-headers-ipc';
import { mapError } from '../../utils/mapError';

function errorHandler(response: Response): { error: FolderError } {
  if (response.status === 409) {
    return {
      error: new FolderError('FOLDER_ALREADY_EXISTS'),
    };
  }
  if (response.status >= 500) {
    return {
      error: new FolderError('SERVER_ERROR'),
    };
  }
  if (response.status === 401 || response.status === 403) {
    return {
      error: new FolderError('NO_PERMISSION'),
    };
  }
  if (response.status >= 400) {
    return {
      error: new FolderError('BAD_REQUEST'),
    };
  }
  return { error: new FolderError('UNKNOWN') };
}

export async function createFolder(deviceUuid: string, plainName: string): Promise<Result<FolderDto, FolderError>> {
  try {
    const headers = await getNewApiHeadersIPC();
    const response = await fetch(`${process.env.NEW_DRIVE_URL}/folders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parentFolderUuid: deviceUuid,
        plainName,
      }),
    });
    if (response.ok) {
      const data: FolderDto = await response.json();
      return { data };
    }
    return errorHandler(response);
  } catch (error) {
    const mappedError = mapError(error);
    logger.error({
      msg: 'error creating a folder',
      error: mappedError.message,
    });
    return {
      error: new FolderError('UNKNOWN'),
    };
  }
}
