import configStore from '../config';

const SIX_HOURS_IN_MILLISECOND = 6 * 60 * 60 * 1000;

export const clearRemoteSyncStore = () => {
  const store = configStore;

  store.set('lastFilesSyncAt', '');
  store.set('lastFoldersSyncAt', '');
};

export function getLastFilesSyncAt(): Date | undefined {
  const value = configStore.get('lastFilesSyncAt');

  if (!value || value.length === 0) return undefined;

  const date = new Date(value);

  date.setTime(date.getTime() - SIX_HOURS_IN_MILLISECOND);

  return date;
}

export function saveLastFilesSyncAt(date: Date, offsetMs: number): Date {
  configStore.set(
    'lastFilesSyncAt',
    new Date(date.getTime() - offsetMs).toISOString()
  );
  return date;
}

export function getLastFoldersSyncAt(): Date | undefined {
  const value = configStore.get('lastFoldersSyncAt');

  if (!value || value.length === 0) return undefined;

  const date = new Date(value);

  date.setTime(date.getTime() - SIX_HOURS_IN_MILLISECOND);

  return date;
}

export function saveLastFoldersSyncAt(date: Date, offsetMs: number): Date {
  configStore.set(
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

export type RemoteSyncStatus = 'IDLE' | 'SYNCED' | 'SYNCING' | 'SYNC_FAILED';
export type SyncConfig = {
  retry: number;
  maxRetries: number;
};

export const SYNC_OFFSET_MS = 0;

export const lastSyncedAtIsNewer = (
  itemUpdatedAt: Date,
  lastItemsSyncAt: Date,
  offset: number
) => {
  return itemUpdatedAt.getTime() - offset > lastItemsSyncAt.getTime();
};
