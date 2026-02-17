import { getNewApiHeaders } from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';
import { Result } from '../../../../../context/shared/domain/Result';
import { logger } from '@internxt/drive-desktop-core/build/backend';

export async function getBackupFolderUuid({
  folderId,
}: {
  folderId: string;
}): Promise<Result<string, DriveServerError>> {
  const { data, error } = await driveServerClient.GET('/folders/{id}/metadata', {
    headers: getNewApiHeaders(),
    path: { id: folderId },
  });

  if (error) {
    logger.error({
      msg: 'Failed to fetch backup folder UUID',
      error,
      path: `/folders/${folderId}/metadata`,
    });
    return { error };
  }

  return { data: data.uuid };
}
