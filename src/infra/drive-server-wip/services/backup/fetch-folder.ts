import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';

export async function fetchFolder(context: { folderUuid: string }) {
  const method = 'GET';
  const endpoint = '/folders/content/{uuid}';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      params: { path: { uuid: context.folderUuid } },
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Fetch folder contents',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });

  return { data, error };
}
