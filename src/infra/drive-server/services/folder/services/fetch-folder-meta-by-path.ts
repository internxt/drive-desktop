import { Result } from '../../../../../context/shared/domain/Result';
import { components } from '../../../../schemas';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

type Props = {
  path: string;
};

type FolderMeta = components['schemas']['FolderDto'];

export async function fetchFolderMetaByPath({ path }: Props): Promise<Result<FolderMeta, DriveServerError>> {
  const { data, error } = await driveServerClient.GET('/folders/meta', {
    query: { path },
  });

  if (error) return { error };

  return { data };
}
