import { RemoteSyncManager } from '../RemoteSyncManager';
import { RemoteSyncedFolder } from '../helpers';

export interface FetchFoldersServiceParams {
  self: RemoteSyncManager;
  folderId?: number;
  folderUuid?: string;
  updatedAtCheckpoint?: Date;
  offset: number;
  status?: string;
}

export interface FetchFoldersServiceResult {
  hasMore: boolean;
  result: RemoteSyncedFolder[];
}

export interface FetchFoldersService {
  run(params: FetchFoldersServiceParams): Promise<FetchFoldersServiceResult>;
}

export interface Query {
  limit: number;
  offset: number;
  status?: string;
  updatedAt?: string;
  order?: string;
  sort?: string;
}
