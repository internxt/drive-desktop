export const WAITING_AFTER_SYNCING = 1000 * 60 * 3; // 5 minutes
export const SIX_HOURS_IN_MILLISECONDS = 6 * 60 * 60 * 1000;
export const FIVETEEN_MINUTES_IN_MILLISECONDS = 30 * 60 * 1000;

export type RemoteSyncedFile = {
  id: number;
  uuid: string;
  fileId: string;
  type: string;
  size: number;
  bucket: string;
  folderId: number;
  folderUuid?: string;
  userId: number;
  modificationTime: string;
  createdAt: string;
  updatedAt: string;
  plainName: string;
  name: string;
  status: 'EXISTS' | 'TRASHED' | 'DELETED';
};

export type RemoteSyncedFolder = {
  type: string;
  id: number;
  parentId: number | null;
  bucket: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  uuid: string;
  plainName: string;
  name: string;
  status: string;
};

export type RemoteSyncStatus =
  | 'IDLE'
  | 'SYNCED'
  | 'SYNCING'
  | 'SYNC_FAILED'
  | 'SYNC_PENDING';
export type SyncConfig = {
  retry: number;
  maxRetries: number;
};

export const WAITING_AFTER_SYNCING_DEFAULT = 1000 * 60 * 3;

export function rewind(original: Date, milliseconds: number): Date {
  const shallowCopy = new Date(original.getTime());

  shallowCopy.setTime(shallowCopy.getTime() - milliseconds);

  return shallowCopy;
}

