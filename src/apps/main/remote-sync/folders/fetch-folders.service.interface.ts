import { paths } from '@/apps/shared/HttpClient/schema';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { RemoteSyncedFolder } from '../helpers';

export type Query = paths['/folders/{id}/folders']['get']['parameters']['query'] & paths['/folders']['get']['parameters']['query'];
export type QueryWorkspace = paths['/workspaces/{workspaceId}/folders']['get']['parameters']['query'] &
  paths['/workspaces/{workspaceId}/folders/{folderUuid}/folders']['get']['parameters']['query'];
export interface FetchFoldersServiceParams {
  self: RemoteSyncManager;
  folderId?: number;
  folderUuid?: string;
  updatedAtCheckpoint?: Date;
  offset: number;
  status: Query['status'];
}

export interface FetchFoldersServiceResult {
  hasMore: boolean;
  result: RemoteSyncedFolder[];
}

export interface FetchFoldersService {
  run(params: FetchFoldersServiceParams): Promise<FetchFoldersServiceResult>;
}
