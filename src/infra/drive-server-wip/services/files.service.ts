import { clientService } from '@/apps/shared/HttpClient/client';
import { paths } from '@/apps/shared/HttpClient/schema';
import { ClientWrapperService } from '../in/client-wrapper.service';
import { noContentWrapper } from '../in/no-content-wrapper.service';

type TGetFilesQuery = paths['/files']['get']['parameters']['query'];
type TCreateThumnailBody = paths['/files/thumbnail']['post']['requestBody']['content']['application/json'];

export class FilesService {
  constructor(
    private readonly client = clientService,
    private readonly clientWrapper = new ClientWrapperService(),
  ) {}

  async getFiles({ query }: { query: TGetFilesQuery }) {
    const promise = this.client.GET('/files', { params: { query } });

    return this.clientWrapper.run({
      promise,
      loggerBody: {
        msg: 'Get files request was not successful',
        context: {
          query,
        },
        attributes: {
          method: 'GET',
          endpoint: '/files',
        },
      },
    });
  }

  async createThumbnail({ body }: { body: TCreateThumnailBody }) {
    const promise = this.client.POST('/files/thumbnail', { body });

    return this.clientWrapper.run({
      promise,
      loggerBody: {
        msg: 'Get files request was not successful',
        context: {
          body,
        },
        attributes: {
          method: 'POST',
          endpoint: '/files/thumbnail',
        },
      },
    });
  }

  async deleteContentFromBucket({ bucketId, contentId }: { bucketId: string; contentId: string }) {
    const promise = noContentWrapper({
      request: this.client.DELETE('/files/{bucketId}/{fileId}', {
        params: { path: { bucketId, fileId: contentId } },
      }),
    });

    return this.clientWrapper.run({
      promise,
      loggerBody: {
        msg: 'Delete file content from bucket request was not successful',
        context: {
          contentId,
        },
        attributes: {
          method: 'DELETE',
          endpoint: '/files/{bucketId}/{fileId}',
        },
      },
    });
  }
}
