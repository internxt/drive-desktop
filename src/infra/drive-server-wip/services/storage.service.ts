import { client } from '@/apps/shared/HttpClient/client';
import { ClientWrapperService } from '../in/client-wrapper.service';
import { noContentWrapper } from '../in/no-content-wrapper.service';

export class StorageService {
  constructor(private readonly clientWrapper = new ClientWrapperService()) {}

  async deleteFolder({ folderId }: { folderId: number }) {
    const promise = noContentWrapper({
      request: client.DELETE('/storage/trash/folder/{folderId}', {
        params: { path: { folderId } },
      }),
    });

    return this.clientWrapper.run({
      promise,
      loggerBody: {
        msg: 'Delete folder request was not successful',
        attributes: {
          method: 'DELETE',
          endpoint: '/storage/trash/folder/{folderId}',
        },
      },
    });
  }

  async deleteFolderWithUuid({ uuid }: { uuid: string }) {
    const promise = noContentWrapper({
      request: client.POST('/storage/trash/add', {
        body: { items: [{ type: 'folder', uuid, id: null }] },
      }),
    });

    return this.clientWrapper.run({
      promise,
      loggerBody: {
        msg: 'Delete folder request was not successful',
        attributes: {
          method: 'POST',
          endpoint: '/storage/trash/add',
        },
      },
    });
  }
}
