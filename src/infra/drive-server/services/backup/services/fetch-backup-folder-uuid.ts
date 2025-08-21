import { components } from '../../../../schemas';
import { Result } from '../../../../../context/shared/domain/Result';
import fetch from 'electron-fetch';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';
import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';

export async function getBackupFolderUuid(backup: {
  enabled: boolean;
  folderId: number;
  folderUuid: string;
}): Promise<Result<string, Error>> {
  if (backup.folderUuid) return { data: backup.folderUuid };
  try {
    const response = await fetch(
      `${process.env.NEW_DRIVE_URL}/folders/${backup.folderId}/metadata`,
      {
        method: 'GET',
        headers: getNewApiHeaders(),
      }
    );
    if (!response.ok) {
      return {
        error: logger.error({
          tag: 'BACKUPS',
          msg: 'Failed to fetch backup folder UUID',
        }),
      };
    }
    const data: components['schemas']['FolderDto'] = await response.json();
    return { data: data.uuid };
  } catch (error) {
    const err = logger.error({
      tag: 'BACKUPS',
      msg: 'Error fetching backup folder UUID',
      error,
    });
    return { error: err };
  }
}
