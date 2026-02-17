import { getNewApiHeaders } from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';
import { GetFolderContentDto } from '../../../out/dto';
import { Result } from '../../../../../context/shared/domain/Result';
import { logger } from '@internxt/drive-desktop-core/build/backend';

export async function fetchFolder(uuid: string): Promise<Result<GetFolderContentDto, DriveServerError>> {
  const { data, error } = await driveServerClient.GET('/folders/content/{uuid}', {
    headers: getNewApiHeaders(),
    path: { uuid },
  });
  if (error) {
    logger.error({
      msg: 'Failed to fetch folder content',
      error,
      path: `/folders/content/${uuid}`,
    });
    return { error };
  }
  if (data.deleted || data.removed) {
    const error = new DriveServerError('NOT_FOUND');
    logger.error({
      msg: 'Folder is marked as deleted or removed',
      error,
      path: `/folders/content/${uuid}`,
    });
    return { error };
  }
  return { data };
}
