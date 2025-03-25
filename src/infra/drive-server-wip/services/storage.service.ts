import { client } from '@/apps/shared/HttpClient/client';
import { loggerService } from '@/apps/shared/logger/logger';

export class StorageService {
  constructor(private readonly logger = loggerService) {}

  async deleteFolder({ folderId }: { folderId: number }) {
    const res = await client.DELETE('/storage/trash/folder/{folderId}', {
      params: { path: { folderId } },
    });

    if (!res.data) {
      return {
        error: this.logger.error({
          msg: 'Delete folder request was not successful',
          exc: res.error,
          attributes: {
            method: 'DELETE',
            endpoint: '/storage/trash/folder/{folderId}',
          },
        }),
      };
    }

    return { data: res.data };
  }
}
