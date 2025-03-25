import { client } from '@/apps/shared/HttpClient/client';
import { ClientWrapperService } from '../in/client-wrapper.service';

export class StorageService {
  constructor(private readonly clientWrapper = new ClientWrapperService()) {}

  async deleteFolder({ folderId }: { folderId: number }) {
    const promise = async () => {
      const { response, error } = await client.DELETE('/storage/trash/folder/{folderId}', {
        params: { path: { folderId } },
      });

      if (response.status === 204) {
        return { data: true, response };
      } else {
        return { error, response };
      }
    };

    return this.clientWrapper.run({
      promise: promise(),
      loggerBody: {
        msg: 'Delete folder request was not successful',
        attributes: {
          method: 'DELETE',
          endpoint: '/storage/trash/folder/{folderId}',
        },
      },
    });
  }
}
