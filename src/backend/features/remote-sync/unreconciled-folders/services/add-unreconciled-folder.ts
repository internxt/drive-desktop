import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { store } from '../store';

type Props = {
  uuid: FolderUuid;
  path: AbsolutePath;
};

export function addUnreconciledFolder({ uuid, path }: Props) {
  store.folders.set(uuid, path);
}
