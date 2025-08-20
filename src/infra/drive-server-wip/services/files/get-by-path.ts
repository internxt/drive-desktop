import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';
import { parseFileDto } from '../../out/dto';

export async function getByPath(context: { path: string }) {
  const method = 'GET';
  const endpoint = '/files/meta';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      params: { query: { path: context.path } },
    });

  const res = await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Get file by path request',
      context,
    },
  });

  if (res.data) {
    return { data: parseFileDto({ fileDto: res.data }) };
  } else {
    return { error: res.error };
  }
}
