import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { sleep } from '@/apps/main/util';

export const store = {
  addEvents: new Map<FileUuid | FolderUuid, NodeJS.Timeout>(),
};

type Props = {
  uuid: FileUuid | FolderUuid;
};

export function trackAddEvent({ uuid }: Props) {
  let timeoutId = store.addEvents.get(uuid);
  if (timeoutId) clearTimeout(timeoutId);

  timeoutId = setTimeout(() => store.addEvents.delete(uuid), 10_000);
  store.addEvents.set(uuid, timeoutId);
}

export async function isMoveEvent({ uuid }: Props) {
  await sleep(2_000);
  return store.addEvents.has(uuid);
}
