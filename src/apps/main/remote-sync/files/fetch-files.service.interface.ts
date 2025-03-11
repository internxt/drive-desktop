import { RemoteSyncManager } from '../RemoteSyncManager';
import { RemoteSyncedFile } from '../helpers';
import { paths } from '@/apps/shared/HttpClient/schema';

export type Query = paths['/files']['get']['parameters']['query'] & paths['/folders/{id}/files']['get']['parameters']['query'];
export type QueryWorkspace = paths['/workspaces/{workspaceId}/files']['get']['parameters']['query'] &
  paths['/workspaces/{workspaceId}/folders/{folderUuid}/files']['get']['parameters']['query'];
export interface FetchFilesServiceParams {
  self: RemoteSyncManager;
  folderId?: number;

  folderUuid?: string;
  updatedAtCheckpoint?: Date;
  offset: number;
  status?: Query['status'];
}

export interface FetchFilesServiceResult {
  hasMore: boolean;
  result: RemoteSyncedFile[];
}
export interface FetchFilesService {
  run(params: FetchFilesServiceParams): Promise<FetchFilesServiceResult>;
}
