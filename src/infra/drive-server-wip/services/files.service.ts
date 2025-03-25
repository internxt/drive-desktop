import { client } from '@/apps/shared/HttpClient/client';
import { paths } from '@/apps/shared/HttpClient/schema';
import { loggerService } from '@/apps/shared/logger/logger';

type TGetFilesQuery = paths['/files']['get']['parameters']['query'];

export class FilesService {
  constructor(private readonly logger = loggerService) {}

  async getFiles({ query }: { query: TGetFilesQuery }) {
    const res = await client.GET('/files', { params: { query } });

    if (!res.data) {
      throw this.logger.error({
        msg: 'Get files request was not successful',
        exc: res.error,
        context: {
          query,
        },
        attributes: {
          endpoint: '/files',
        },
      });
    }

    return res.data;
  }
}
