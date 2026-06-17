import { Result } from '../../../../../context/shared/domain/Result';
import { components } from '../../../../schemas';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

type Props = {
  path: string;
};

type FileMeta = components['schemas']['FileDto'];

export async function fetchFileMetaByPath({ path }: Props): Promise<Result<FileMeta, DriveServerError>> {
  const { data, error } = await driveServerClient.GET('/files/meta', {
    query: { path },
  });

  if (error) return { error };

  return { data };
}
