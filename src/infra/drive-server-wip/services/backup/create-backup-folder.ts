import { client } from '@/apps/shared/HttpClient/client';
import { getRequestKey } from '../../in/get-in-flight-request';
import { clientWrapper } from '../../in/client-wrapper.service';

type Props = { parentFolderUuid: string; plainName: string };

export async function createBackupFolder(context: Props) {
  const method = 'POST';
  const endpoint = '/folders';
  const key = getRequestKey({ method, endpoint, context });
  const promiseFn = () =>
    client.POST(endpoint, {
      body: { ...context },
    });
  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Create backup folder request',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });
  return { data, error };
}
