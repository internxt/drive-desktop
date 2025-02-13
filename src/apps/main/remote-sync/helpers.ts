import { paths } from '@/apps/shared/HttpClient/schema';

export const FIVETEEN_MINUTES_IN_MILLISECONDS = 30 * 60 * 1000;

export type RemoteSyncedFile = paths['/files']['get']['responses']['200']['content']['application/json'][number];
export type RemoteSyncedFolder = paths['/folders']['get']['responses']['200']['content']['application/json'][number];

export type RemoteSyncStatus =
  | 'IDLE'
  | 'SYNCED'
  | 'SYNCING'
  | 'SYNC_FAILED'
  | 'SYNC_PENDING';

export const WAITING_AFTER_SYNCING_DEFAULT = 1000 * 60 * 3;

export function rewind(original: Date, milliseconds: number): Date {
  const shallowCopy = new Date(original.getTime());

  shallowCopy.setTime(shallowCopy.getTime() - milliseconds);

  return shallowCopy;
}
