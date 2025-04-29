const FIVETEEN_MINUTES_IN_MILLISECONDS = 30 * 60 * 1000;

export type RemoteSyncStatus = 'IDLE' | 'SYNCED' | 'SYNCING' | 'SYNC_FAILED' | 'SYNC_PENDING';

export function rewind(original: Date): Date {
  const shallowCopy = new Date(original.getTime());

  shallowCopy.setTime(shallowCopy.getTime() - FIVETEEN_MINUTES_IN_MILLISECONDS);

  return shallowCopy;
}
