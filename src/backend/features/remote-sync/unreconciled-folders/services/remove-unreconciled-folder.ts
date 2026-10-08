import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { store } from '../store';

export function removeUnreconciledFolder({ uuid }: { uuid: FolderUuid }) {
  store.folders.delete(uuid);
}
