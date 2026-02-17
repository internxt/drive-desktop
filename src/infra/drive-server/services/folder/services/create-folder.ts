import { FolderDto } from '../../../../drive-server/out/dto';
import { Result } from './../../../../../context/shared/domain/Result';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';
import { DriveServerError } from '../../../drive-server.error';
import { logger } from '@internxt/drive-desktop-core/build/backend';
type Props = {
  parentFolderUuid: string;
  plainName: string;
};

export async function createFolder({
  parentFolderUuid,
  plainName,
}: Props): Promise<Result<FolderDto, DriveServerError>> {
  const { data, error } = await driveServerClient.POST('/folders', {
    headers: getNewApiHeaders(),
    body: {
      parentFolderUuid,
      plainName,
    },
  });
  if (error) {
    logger.error({
      msg: 'error creating a folder',
      error,
      path: '/folders',
    });
    return { error };
  }
  return { data };
}
