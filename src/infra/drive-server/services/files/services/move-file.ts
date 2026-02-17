import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Result } from '../../../../../context/shared/domain/Result';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

export async function moveFile({
  destinationFolder,
  uuid,
}: {
  destinationFolder: string;
  uuid: string;
}): Promise<Result<boolean, DriveServerError>> {
  const { error } = await driveServerClient.PATCH('/files/{uuid}', {
    path: { uuid },
    body: {
      destinationFolder,
    },
    headers: getNewApiHeaders(),
  });

  if (error) {
    logger.error({
      msg: 'Error moving file',
      error,
      path: `/files/${uuid}`,
    });
    return { error };
  }
  return { data: true };
}
