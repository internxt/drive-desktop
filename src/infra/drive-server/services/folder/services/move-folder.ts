import { Result } from '../../../../../context/shared/domain/Result';
import { FolderDto } from '../../../../../infra/drive-server/out/dto';
import { DriveServerError } from '../../../drive-server.error';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';
import { logger } from '@internxt/drive-desktop-core/build/backend';
type Props = {
  uuid: string;
  destinationFolder: string;
};
export async function moveFolder({ uuid, destinationFolder }: Props): Promise<Result<FolderDto, DriveServerError>> {
  const { data, error } = await driveServerClient.PATCH('/folders/{uuid}', {
    headers: getNewApiHeaders(),
    path: { uuid },
    body: { destinationFolder },
  });
  if (error) {
    logger.error({
      msg: 'Failed to move folder',
      error,
      path: `/folders/${uuid}`,
    });
    return { error };
  }
  return { data };
}
