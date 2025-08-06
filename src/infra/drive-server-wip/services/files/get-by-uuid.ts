import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { parseFileDto } from '../../out/dto';

export async function getByUuid(context: { uuid: FileUuid }) {
  const method = 'GET';
  const endpoint = '/files/{uuid}/meta';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      params: { path: { uuid: context.uuid } },
    });

  const res = await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Get file by uuid',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });

  if (res.data) {
    return { data: parseFileDto({ fileDto: res.data }) };
  } else {
    return { error: res.error };
  }
}
