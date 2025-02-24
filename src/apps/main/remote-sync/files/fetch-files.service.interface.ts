import { RemoteSyncManager } from '../RemoteSyncManager';
import { RemoteSyncedFile } from '../helpers';
export interface FetchFilesServiceParams {
  self: RemoteSyncManager;
  folderId?: number;

  folderUuid?: string;
  updatedAtCheckpoint?: Date;
  offset: number;
  status?: string;
}

export interface FetchFilesServiceResult {
  hasMore: boolean;
  result: RemoteSyncedFile[];
}
export interface FetchFilesService {
  run(params: FetchFilesServiceParams): Promise<FetchFilesServiceResult>;
}

export interface Query {
  limit: number;
  offset: number;
  status?: string;
  updatedAt?: string;
  order?: string;
  sort?: string;
}
