import { isFilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import VirtualDrive from '@/node-win/virtual-drive';

export class GetFileIdentityError extends Error {
  constructor(public readonly code: 'NON_EXISTS' | 'NOT_A_FILE') {
    super(code);
  }
}

type TProps = {
  drive: VirtualDrive;
  path: string;
};

export function getFileIdentity({ drive, path }: TProps) {
  const identity = drive.getFileIdentity({ path });
  const isFile = isFilePlaceholderId(identity);

  if (!identity) {
    return { error: new GetFileIdentityError('NON_EXISTS') };
  }

  if (!isFile) {
    return { error: new GetFileIdentityError('NOT_A_FILE') };
  }

  return { data: identity };
}
