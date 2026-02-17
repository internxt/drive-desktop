import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Result } from '../../../../../context/shared/domain/Result';
import { FileDto } from '../../../out/dto';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';
import { DriveServerError } from '../../../drive-server.error';
import { driveServerClient } from '../../../client/drive-server.client.instance';

type Props = {
  plainName: string;
  type: string;
  fileUuid: string;
};

export async function renameFile({ plainName, type, fileUuid }: Props): Promise<Result<FileDto, DriveServerError>> {
  const { data, error } = await driveServerClient.PUT('/files/{uuid}/meta', {
    headers: getNewApiHeaders(),
    path: { uuid: fileUuid },
    body: {
      plainName,
      type,
    },
  });

  if (data) {
    return { data: data satisfies FileDto };
  }
  logger.error({
    msg: 'Error renaming file',
    error,
    path: `/files/${fileUuid}/meta`,
  });
  return { error };
}
