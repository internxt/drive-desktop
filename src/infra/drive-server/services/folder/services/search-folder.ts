import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Result } from '../../../../../context/shared/domain/Result';
import { FolderDto } from '../../../../drive-server/out/dto';
import { DriveServerError } from '../../../drive-server.error';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';

type Props = {
  parentId: number;
  offset: number;
  limit?: number;
};

export async function searchFolder({
  parentId,
  offset,
  limit = 50,
}: Props): Promise<Result<FolderDto[], DriveServerError>> {
  const { data, error } = await driveServerClient.GET('/folders/{id}/folders', {
    headers: getNewApiHeaders(),
    path: { id: parentId },
    query: { offset, limit },
  });
  if (error) {
    logger.error({
      msg: 'Error searching subfolders',
      error,
      path: `/folders/${parentId}/folders`,
    });
    return { error };
  }
  return { data: data.result };
}
