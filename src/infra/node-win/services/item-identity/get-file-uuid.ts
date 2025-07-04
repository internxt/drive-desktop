import { FileUuid } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { getFileIdentity } from './get-file-identity';
import VirtualDrive from '@/node-win/virtual-drive';

type TProps = {
  drive: VirtualDrive;
  path: string;
};

export function getFileUuid({ drive, path }: TProps) {
  const identity = getFileIdentity({ drive, path });

  if (identity.error) {
    return { error: identity.error };
  }

  return { data: identity.data.split(':')[1] as FileUuid };
}
