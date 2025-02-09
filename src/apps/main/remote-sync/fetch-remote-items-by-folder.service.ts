import { logger } from '../../shared/logger/logger';
import { RemoteSyncManager } from './RemoteSyncManager';

export class FetchRemoteItemsByFolderService {
  async run({
    self,
    folderId,
    type,
    params,
  }: {
    self: RemoteSyncManager;
    folderId: number;
    type: 'files' | 'folders';
    params: {
      limit: number;
      offset: number;
      status: string;
      updatedAt?: string;
    };
  }) {
    const url = `${process.env.NEW_DRIVE_URL}/drive/folders/${folderId}/${type}`;
    const response = await self.config.httpClient.get(url, { params: { ...params, sort: 'ASC' } });
    logger.info({ msg: `Fetching item ${type} by folder response`, items: response.data.result?.length });
    return { status: response.status, data: response.data.result };
  }
}
