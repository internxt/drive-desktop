import { trimPlaceholderId } from '@/apps/sync-engine/callbacks-controllers/controllers/placeholder-id';
import { isFolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import VirtualDrive from '@/node-win/virtual-drive';

export class GetFolderIdentityError extends Error {
  constructor(public readonly code: 'NON_EXISTS' | 'NOT_A_FOLDER') {
    super(code);
  }
}

type TProps = {
  drive: VirtualDrive;
  path: string;
};

export function getFolderIdentity({ drive, path }: TProps) {
  const identity = drive.getFileIdentity({ path });
  const isFolder = isFolderPlaceholderId(identity);

  if (!identity) {
    return { error: new GetFolderIdentityError('NON_EXISTS') };
  }

  if (!isFolder) {
    return { error: new GetFolderIdentityError('NOT_A_FOLDER') };
  }

  return { data: trimPlaceholderId({ placeholderId: identity }) };
}
