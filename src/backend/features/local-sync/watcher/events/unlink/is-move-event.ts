import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { sleep } from '@/apps/main/util';

export const store = {
  addFileEvents: new Map<FileUuid, NodeJS.Timeout>(),
  addFolderEvents: new Map<FolderUuid, NodeJS.Timeout>(),
};

function trackAddEvent<T>(map: Map<T, NodeJS.Timeout>, uuid: T) {
  let timeoutId = map.get(uuid);
  if (timeoutId) clearTimeout(timeoutId);

  timeoutId = setTimeout(() => map.delete(uuid), 5_000);
  map.set(uuid, timeoutId);
}

async function isMoveEvent<T>(map: Map<T, NodeJS.Timeout>, uuid: T) {
  await sleep(2_000);

  const timeoutId = map.get(uuid);
  if (!timeoutId) return false;

  clearTimeout(timeoutId);
  map.delete(uuid);
  return true;
}

export function trackAddFileEvent({ uuid }: { uuid: FileUuid }) {
  trackAddEvent(store.addFileEvents, uuid);
}
export function trackAddFolderEvent({ uuid }: { uuid: FolderUuid }) {
  trackAddEvent(store.addFolderEvents, uuid);
}
export function isMoveFileEvent({ uuid }: { uuid: FileUuid }) {
  return isMoveEvent(store.addFileEvents, uuid);
}
export function isMoveFolderEvent({ uuid }: { uuid: FolderUuid }) {
  return isMoveEvent(store.addFolderEvents, uuid);
}
