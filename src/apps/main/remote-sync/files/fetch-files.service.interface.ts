import { RemoteSyncManager } from '../RemoteSyncManager';
import { RemoteSyncedFile } from '../helpers';
import { paths } from '@/apps/shared/HttpClient/schema';

export type QueryFiles = paths['/files']['get']['parameters']['query'];
export type QueryFilesInFolder = paths['/folders/{id}/files']['get']['parameters']['query'];
export type Query = QueryFiles | QueryFilesInFolder;
export type QueryFilesInWorkspace = paths['/workspaces/{workspaceId}/files']['get']['parameters']['query'];
export type QueryFilesInFolderInWorkspace = paths['/workspaces/{workspaceId}/folders/{folderUuid}/files']['get']['parameters']['query'];
export type QueryWorkspace = QueryFilesInWorkspace | QueryFilesInFolderInWorkspace;
export interface FetchFilesServiceParams {
  self: RemoteSyncManager;
  folderId?: number;
  folderUuid?: string;
  updatedAtCheckpoint?: Date;
  offset: number;
  status?: QueryFiles['status'];
}
export interface FetchFilesServiceResult {
  hasMore: boolean;
  result: RemoteSyncedFile[];
}
export interface FetchFilesService {
  run(params: FetchFilesServiceParams): Promise<FetchFilesServiceResult>;
}
