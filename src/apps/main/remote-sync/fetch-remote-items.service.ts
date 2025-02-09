import { logger } from '../../shared/logger/logger';
import { RemoteSyncManager } from './RemoteSyncManager';

export class FetchRemoteItemsService {
  async run({
    self,
    params,
    type,
  }: {
    self: RemoteSyncManager;
    type: 'files' | 'folders';
    params: {
      limit: number;
      offset: number;
      status: string;
      updatedAt?: string;
    };
  }) {
    const url = `${process.env.NEW_DRIVE_URL}/drive/${type}`;
    const response = await self.config.httpClient.get(url, { params });
    logger.info({ msg: `Fetching item ${type} response`, items: response.data?.length });
    return { status: response.status, data: response.data };
  }
}
