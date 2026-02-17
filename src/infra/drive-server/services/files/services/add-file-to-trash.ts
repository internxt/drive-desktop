import { logger } from '@internxt/drive-desktop-core/build/backend';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';
import { Result } from '../../../../../context/shared/domain/Result';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

export async function addFileToTrash(fileUuid: string): Promise<Result<boolean, DriveServerError>> {
  const { error } = await driveServerClient.POST('/storage/trash/add', {
    headers: getNewApiHeaders(),
    body: {
      items: [{ type: 'file', uuid: fileUuid }],
    },
  });
  if (error) {
    logger.error({
      msg: 'Error adding file to trash',
      error,
      path: '/storage/trash/add',
    });
    return { error };
  }
  return { data: true };
}
