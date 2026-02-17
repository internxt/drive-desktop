import { getNewApiHeaders } from '../../../../../apps/main/auth/service';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { logger } from '@internxt/drive-desktop-core/build/backend';

export async function fetchFolderTreeByUuid({ uuid }: { uuid: string }) {
  const { data, error } = await driveServerClient.GET('/folders/{uuid}/tree', {
    headers: getNewApiHeaders(),
    path: { uuid },
  });

  if (error) {
    logger.error({
      msg: 'Failed to fetch folder tree',
      error,
      path: `/folders/${uuid}/tree`,
    });
    return { error };
  }

  return { data };
}
