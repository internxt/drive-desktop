import { Result } from '../../../../../context/shared/domain/Result';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';
import { UserFileSizeLimit } from '../../../out/dto';

export async function getUserFileSizeLimit(): Promise<Result<UserFileSizeLimit, DriveServerError>> {
  const { data, error } = await driveServerClient.GET('/files/limits');

  if (error) return { error };

  return { data: data.maxUploadFileSize };
}
