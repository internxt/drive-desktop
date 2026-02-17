import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Result } from './../../../../../context/shared/domain/Result';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';
import { DriveServerError } from '../../../drive-server.error';
import { driveServerClient } from '../../../client/drive-server.client.instance';
export async function deleteFileFromStorageByFileId({
  bucketId,
  fileId,
}: {
  bucketId: string;
  fileId: string;
}): Promise<Result<boolean, DriveServerError>> {
  const { error } = await driveServerClient.DELETE('/files/{bucketId}/{fileId}', {
    headers: getNewApiHeaders(),
    path: {
      bucketId,
      fileId,
    },
  });

  if (error) {
    logger.error({
      msg: 'error response deleting file content from storage',
      path: `/files/${bucketId}/${fileId}`,
      error,
    });
    return { error };
  }
  return { data: true };
}
