import { paths } from '@/apps/shared/HttpClient/schema';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';

export type QueryFolders = paths['/folders']['get']['parameters']['query'];
export type QueryFoldersInWorkspace = paths['/workspaces/{workspaceId}/folders']['get']['parameters']['query'];
export type QueryFoldersInFolderInWorkspace = paths['/workspaces/{workspaceId}/folders/{folderUuid}/folders']['get']['parameters']['query'];
export type QueryWorkspace = QueryFoldersInWorkspace | QueryFoldersInFolderInWorkspace;
export interface FetchFoldersServiceParams {
  self: RemoteSyncManager;
  folderUuid?: string;
  updatedAtCheckpoint?: Date;
  offset: number;
  status: QueryFolders['status'];
}

export interface FetchFoldersServiceResult {
  hasMore: boolean;
  result: FolderDto[];
}

export interface FetchFoldersService {
  run(params: FetchFoldersServiceParams): Promise<FetchFoldersServiceResult>;
}
