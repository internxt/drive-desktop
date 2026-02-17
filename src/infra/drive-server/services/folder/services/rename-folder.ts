import { Result } from '../../../../../context/shared/domain/Result';
import { FolderDto } from '../../../../../infra/drive-server/out/dto';
import { DriveServerError } from '../../../drive-server.error';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';
import { logger } from '@internxt/drive-desktop-core/build/backend';
type Props = {
  uuid: string;
  plainName: string;
};
export async function renameFolder({ uuid, plainName }: Props): Promise<Result<FolderDto, DriveServerError>> {
  const { data, error } = await driveServerClient.PUT('/folders/{uuid}/meta', {
    headers: getNewApiHeaders(),
    path: { uuid },
    body: { plainName },
  });

  if (error) {
    logger.error({
      msg: 'Failed to update folder name',
      error,
      path: `/folders/${uuid}/meta`,
    });
    return { error };
  }
  return { data };
}
