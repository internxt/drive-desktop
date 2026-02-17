import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Result } from './../../../../../context/shared/domain/Result';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';
import { CreateThumbnailDto, ThumbnailDto } from '../../../out/dto';
import { DriveServerError } from '../../../drive-server.error';
import { driveServerClient } from '../../../client/drive-server.client.instance';

export async function createThumbnail(body: CreateThumbnailDto): Promise<Result<ThumbnailDto, DriveServerError>> {
  const { data, error } = await driveServerClient.POST('/files/thumbnail', {
    body,
    headers: getNewApiHeaders(),
  });
  if (error) {
    logger.error({
      msg: 'error response creating a thumbnail',
      path: '/files/thumbnail',
      error,
    });
    return { error };
  }
  return { data };
}
