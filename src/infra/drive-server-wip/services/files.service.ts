import { clientService } from '@/apps/shared/HttpClient/client';
import { paths } from '@/apps/shared/HttpClient/schema';
import { ClientWrapperService } from '../in/client-wrapper.service';

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
}
