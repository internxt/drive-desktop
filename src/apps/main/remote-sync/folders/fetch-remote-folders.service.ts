import { FetchRemoteItemsByFolderService } from '../fetch-remote-items-by-folder.service';
import { FetchRemoteItemsService } from '../fetch-remote-items.service';
import { RemoteSyncedFolder } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import Logger from 'electron-log';

export class FetchRemoteFoldersService {
  constructor(
    private readonly fetchRemoteItems = new FetchRemoteItemsService(),
    private readonly fetchRemoteItemsByFolder = new FetchRemoteItemsByFolderService()
  ) {}

  async run({
    self,
    updatedAtCheckpoint,
    folderId,
    offset,
    status,
  }: {
    self: RemoteSyncManager;
    folderId?: number;
    updatedAtCheckpoint?: Date;
    offset: number;
    status: string;
  }): Promise<{
    hasMore: boolean;
    result: RemoteSyncedFolder[];
  }> {
    const params = {
      limit: self.config.fetchFoldersLimitPerRequest,
      offset,
      status,
      updatedAt: updatedAtCheckpoint?.toISOString(),
    };

    const promise = folderId
      ? this.fetchRemoteItemsByFolder.run({ self, folderId, type: 'folders', params })
      : this.fetchRemoteItems.run({ self, type: 'folders', params });

    const allFoldersResponse = await promise;

    if (allFoldersResponse.status > 299) {
      throw new Error(
        `Fetch folders response not ok with body ${JSON.stringify(allFoldersResponse.data, null, 2)} and status ${allFoldersResponse.status}`
      );
    }

    if (!Array.isArray(allFoldersResponse.data)) {
      Logger.info(`Expected to receive an array of folders, but instead received ${JSON.stringify(allFoldersResponse, null, 2)}`);
      throw new Error('Did not receive an array of folders');
    }

    const hasMore = allFoldersResponse.data.length === self.config.fetchFoldersLimitPerRequest;

    return {
      hasMore,
      result:
        allFoldersResponse.data && Array.isArray(allFoldersResponse.data)
          ? allFoldersResponse.data.map(this.patchDriveFolderResponseItem)
          : [],
    };
  }

  private patchDriveFolderResponseItem = (payload: any): RemoteSyncedFolder => {
    let status: RemoteSyncedFolder['status'] = payload.status;

    if (!status && !payload.removed) {
      status = 'EXISTS';
    }

    if (!status && payload.removed) {
      status = 'REMOVED';
    }

    if (!status && payload.deleted) {
      status = 'DELETED';
    }

    return {
      ...payload,
      status,
    };
  };
}
