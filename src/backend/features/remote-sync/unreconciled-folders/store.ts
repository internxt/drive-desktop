import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type Store = {
  folders: Map<FolderUuid, AbsolutePath>;
};

export const store: Store = {
  folders: new Map(),
};

export function clearStore() {
  store.folders.clear();
}
