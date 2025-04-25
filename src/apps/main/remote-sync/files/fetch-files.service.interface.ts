import { RemoteSyncManager } from '../RemoteSyncManager';
import { paths } from '@/apps/shared/HttpClient/schema';

export type QueryFiles = paths['/files']['get']['parameters']['query'];
export interface FetchFilesServiceParams {
  self: RemoteSyncManager;
  folderUuid?: string;
  updatedAtCheckpoint?: Date;
  offset: number;
  status: QueryFiles['status'];
}
