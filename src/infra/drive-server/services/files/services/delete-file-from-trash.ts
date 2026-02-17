import { logger } from '@internxt/drive-desktop-core/build/backend';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';
import { Result } from '../../../../../context/shared/domain/Result';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

export async function deleteFileFromTrash(fileId: string): Promise<Result<boolean, DriveServerError>> {
  const { error } = await driveServerClient.DELETE('/storage/trash/file/{fileId}', {
    path: { fileId },
    headers: getNewApiHeaders(),
  });
  if (error) {
    logger.error({
      msg: 'Error deleting file from trash',
      error,
      path: `/storage/trash/file/${fileId}`,
    });
    return { error };
  }
  return { data: true };
}
