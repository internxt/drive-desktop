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

export const SYNC_OFFSET_MS = 0;
export const WAITING_AFTER_SYNCING_DEFAULT = 1000 * 60 * 3;

export const lastSyncedAtIsNewer = (
  itemUpdatedAt: Date,
  lastItemsSyncAt: Date,
  offset: number
) => {
  return itemUpdatedAt.getTime() - offset > lastItemsSyncAt.getTime();
};

export function rewind(original: Date, milliseconds: number): Date {
  const shallowCopy = new Date(original.getTime());

  shallowCopy.setTime(shallowCopy.getTime() - milliseconds);

  return shallowCopy;
}

export interface ItemContententAttributes {
  type: string;
  id: number;
  parentId: number | null;
  parentUuid: string | null;
  name: string;
  parent: ItemContententAttributes | null;
  bucket: string | null;
  userId: number;
  encryptVersion: string | null;
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  uuid: string;
  plainName: string;
  size: number;
  removed: boolean;
  removedAt: string | null;
  status: string;
  children: ItemContententAttributes[];
  files: any[];
  sharings?: any[]; // Esta propiedad es opcional porque no aparece en el objeto principal
}
