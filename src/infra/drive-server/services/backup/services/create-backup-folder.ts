import { BackupError } from '../../../../../apps/backups/BackupError';
import { Result } from '../../../../../context/shared/domain/Result';
import { components } from '../../../../schemas';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';
import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';
import fetch, { Response } from 'electron-fetch';
import { mapError } from '../../utils/mapError';

function errorHandler(response: Response): { error: BackupError } {
  if (response.status === 409) {
    return {
      error: new BackupError('FOLDER_ALREADY_EXISTS'),
    };
  }
  if (response.status >= 500) {
    return {
      error: new BackupError('SERVER_ERROR'),
    };
  }
  if (response.status === 401 || response.status === 403) {
    return {
      error: new BackupError('NO_PERMISSION'),
    };
  }
  if (response.status >= 400) {
    return {
      error: new BackupError('BAD_RESPONSE'),
    };
  }
  return { error: new BackupError('UNKNOWN') };
}

export async function createBackupFolder(
  deviceUuid: string,
  plainName: string,
): Promise<Result<components['schemas']['FolderDto'], BackupError>> {
  try {
    const response = await fetch(`${process.env.NEW_DRIVE_URL}/folders`, {
      method: 'POST',
      headers: getNewApiHeaders(),
      body: JSON.stringify({
        parentFolderUuid: deviceUuid,
        plainName,
      }),
    });
    if (response.ok) {
      const data: components['schemas']['FolderDto'] = await response.json();
      return { data };
    }
    return errorHandler(response);
  } catch (error) {
    const mappedError = mapError(error);
    logger.error({
      tag: 'BACKUPS',
      msg: 'error posting a backup',
      error: mappedError.message,
    });
    return {
      error: new BackupError('UNKNOWN'),
    };
  }
}
