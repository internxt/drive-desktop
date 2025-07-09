import { FolderUuid } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { getFolderIdentity } from './get-folder-identity';
import VirtualDrive from '@/node-win/virtual-drive';

type TProps = {
  drive: VirtualDrive;
  path: string;
  rootUuid: string;
};

export function getFolderUuid({ drive, path, rootUuid }: TProps) {
  if (path === '/') {
    return { data: rootUuid as FolderUuid };
  }

  const identity = getFolderIdentity({ drive, path });

  if (identity.error) {
    return { error: identity.error };
  }

  return { data: identity.data.split(':')[1] as FolderUuid };
}
