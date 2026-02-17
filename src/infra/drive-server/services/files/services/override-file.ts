import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Result } from '../../../../../context/shared/domain/Result';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';

type Props = {
  fileUuid: string;
  fileContentsId: string;
  fileSize: number;
};

export async function overrideFile({
  fileUuid,
  fileContentsId,
  fileSize,
}: Props): Promise<Result<boolean, DriveServerError>> {
  const { error } = await driveServerClient.PUT('/files/{uuid}', {
    headers: getNewApiHeaders(),
    path: { uuid: fileUuid },
    body: {
      fileId: fileContentsId,
      size: fileSize,
    },
  });
  if (error) {
    logger.error({
      msg: 'Error overriding file',
      error,
      path: `/files/${fileUuid}`,
    });
    return { error };
  }
  return { data: true };
}
