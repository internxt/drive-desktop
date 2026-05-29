import { type AuthContext } from '../../../../apps/sync-engine/config';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';

export async function getUserFileSizeLimit({ ctx }: { ctx: AuthContext }) {
  const method = 'GET';
  const endpoint = '/files/limits';
  const key = getRequestKey({ method, endpoint });
  const promiseFn = () =>
    ctx.client.GET(endpoint, {
      signal: ctx.abortController.signal,
    });

  const { data, error } = await clientWrapper({
    promiseFn,
    key,
    loggerBody: { msg: 'Get user file size limit request' },
  });

  if (error) return { error };

  return {
    data: {
      maxUploadFileSize: data.maxUploadFileSize,
    },
  };
}
