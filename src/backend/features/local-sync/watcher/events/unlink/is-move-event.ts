import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { sleep } from '@/apps/main/util';

export const store = {
  addEvents: new Set<FileUuid>(),
  addDirEvents: new Set<FolderUuid>(),
};

export async function trackAddEvent({ uuid }: { uuid: FileUuid }) {
  store.addEvents.add(uuid);
  await sleep(15_000);
  store.addEvents.delete(uuid);
}

export async function trackAddDirEvent({ uuid }: { uuid: FolderUuid }) {
  store.addDirEvents.add(uuid);
  await sleep(15_000);
  store.addDirEvents.delete(uuid);
}

export async function isMoveEvent({ uuid }: { uuid: FileUuid }) {
  await sleep(5_000);
  const isMoveEvent = store.addEvents.has(uuid);
  if (isMoveEvent) store.addEvents.delete(uuid);
  return isMoveEvent;
}

export async function isMoveDirEvent({ uuid }: { uuid: FolderUuid }) {
  await sleep(5_000);
  const isMoveEvent = store.addDirEvents.has(uuid);
  if (isMoveEvent) store.addDirEvents.delete(uuid);
  return isMoveEvent;
}
