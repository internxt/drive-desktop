import Store from 'electron-store';

export const remoteSyncStore = new Store<{
  lastFilesSyncAt?: string;
  lastFoldersSyncAt?: string;
}>();

export const clearRemoteSyncStore = () => remoteSyncStore.clear();
export function getLastFilesSyncAt(): Date | undefined {
  const value = remoteSyncStore.get('lastFilesSyncAt');

  if (!value) return undefined;

  return new Date(value);
}

export function saveLastFilesSyncAt(date: Date, offsetMs: number): Date {
  remoteSyncStore.set(
    'lastFilesSyncAt',
    new Date(date.getTime() - offsetMs).toISOString()
  );
  return date;
}

export function getLastFoldersSyncAt(): Date | undefined {
  const value = remoteSyncStore.get('lastFoldersSyncAt');

  if (!value) return undefined;

  return new Date(value);
}

export function saveLastFoldersSyncAt(date: Date, offsetMs: number): Date {
  remoteSyncStore.set(
    'lastFoldersSyncAt',
    new Date(date.getTime() - offsetMs).toISOString()
  );
  return date;
}

export type RemoteSyncedFile = {
  id: number;
  uuid: string;
  fileId: string;
  type: string;
  size: number;
  bucket: string | null;
  folderId: number;
  folderUuid?: string;
  userId: number;
  modificationTime: string;
  createdAt: string;
  updatedAt: string;
  plainName: string;
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
  status: string;
};

export type RemoteSyncStatus = 'IDLE' | 'SYNCED' | 'SYNCING' | 'SYNC_FAILED';
export type SyncConfig = {
  retry: number;
  maxRetries: number;
};

// 1 day in MS
export const SYNC_OFFSET_MS = 60 * 1000 * 60 * 24;

export const lastSyncedAtIsNewer = (
  itemUpdatedAt: Date,
  lastItemsSyncAt: Date,
  offset: number
) => {
  return itemUpdatedAt.getTime() - offset > lastItemsSyncAt.getTime();
};
