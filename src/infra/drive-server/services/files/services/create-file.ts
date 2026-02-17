import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Result } from './../../../../../context/shared/domain/Result';
import { FileDto, CreateFileDto } from '../../../out/dto';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';
import { DriveServerError } from '../../../drive-server.error';
export async function createFile(body: CreateFileDto): Promise<Result<FileDto, DriveServerError>> {
  const { data, error } = await driveServerClient.POST('/files', {
    body,
    headers: getNewApiHeaders(),
  });

  if (error) {
    logger.error({
      msg: 'error response creating a file',
      path: '/files',
      error,
    });
    return { error };
  }
  return { data };
}
