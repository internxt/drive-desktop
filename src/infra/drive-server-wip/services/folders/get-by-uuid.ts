import { client } from '@/apps/shared/HttpClient/client';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getRequestKey } from '../../in/get-in-flight-request';
import { parseFolderDto } from '../../out/dto';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

export async function getByUuid(context: { uuid: FolderUuid }) {
  const method = 'GET';
  const endpoint = '/folders/{uuid}/meta';
  const key = getRequestKey({ method, endpoint, context });

  const promiseFn = () =>
    client.GET(endpoint, {
      params: { path: { uuid: context.uuid } },
    });

  const res = await clientWrapper({
    promiseFn,
    key,
    loggerBody: {
      msg: 'Get folder by uuid',
      context,
      attributes: {
        method,
        endpoint,
      },
    },
  });

  if (res.data) {
    return { data: parseFolderDto({ folderDto: res.data }) };
  } else {
    return { error: res.error };
  }
}
