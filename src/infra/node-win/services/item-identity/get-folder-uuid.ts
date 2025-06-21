import { getFolderIdentity } from './get-folder-identity';
import VirtualDrive from '@/node-win/virtual-drive';

type TProps = {
  drive: VirtualDrive;
  path: string;
  rootUuid: string;
};

export function getFolderUuid({ drive, path, rootUuid }: TProps) {
  if (path === '/') {
    return { data: rootUuid };
  }

  const identity = getFolderIdentity({ drive, path });

  if (identity.error) {
    return { error: identity.error };
  }

  return { data: identity.data.split(':')[1] };
}
