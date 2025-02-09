import { FetchRemoteItemsByFolderService } from '../fetch-remote-items-by-folder.service';
import { FetchRemoteItemsService } from '../fetch-remote-items.service';
import { RemoteSyncedFile } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import Logger from 'electron-log';

export class FetchRemoteFilesService {
  constructor(
    private readonly fetchRemoteItems = new FetchRemoteItemsService(),
    private readonly fetchRemoteItemsByFolder = new FetchRemoteItemsByFolderService()
  ) {}

  async run({
    self,
    updatedAtCheckpoint,
    offset,
    status,
    folderId,
  }: {
    self: RemoteSyncManager;
    folderId?: number;
    updatedAtCheckpoint?: Date;
    offset: number;
    status: string;
  }): Promise<{
    hasMore: boolean;
    result: RemoteSyncedFile[];
  }> {
    const params = {
      limit: self.config.fetchFilesLimitPerRequest,
      offset,
      status,
      updatedAt: updatedAtCheckpoint?.toISOString(),
    };

    const promise = folderId
      ? this.fetchRemoteItemsByFolder.run({ self, folderId, type: 'files', params })
      : this.fetchRemoteItems.run({ self, type: 'files', params });

    const allFilesResponse = await promise;

    if (allFilesResponse.status > 299) {
      throw new Error(
        `Fetch files response not ok with body ${JSON.stringify(allFilesResponse.data, null, 2)} and status ${allFilesResponse.status}`
      );
    }

    if (!Array.isArray(allFilesResponse.data)) {
      Logger.info(`Expected to receive an array of files, but instead received ${JSON.stringify(allFilesResponse, null, 2)}`);
      throw new Error('Did not receive an array of files');
    }

    const hasMore = allFilesResponse.data.length === self.config.fetchFilesLimitPerRequest;

    return {
      hasMore,
      result:
        allFilesResponse.data && Array.isArray(allFilesResponse.data) ? allFilesResponse.data.map(this.patchDriveFileResponseItem) : [],
    };
  }

  private patchDriveFileResponseItem = (payload: any): RemoteSyncedFile => {
    return {
      ...payload,
      size: typeof payload.size === 'string' ? parseInt(payload.size) : payload.size,
    };
  };
}
