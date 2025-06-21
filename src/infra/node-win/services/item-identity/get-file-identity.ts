import { logger } from '@/apps/shared/logger/logger';
import { isFilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import VirtualDrive from '@/node-win/virtual-drive';

type TProps = {
  drive: VirtualDrive;
  path: string;
};

export function getFileIdentity({ drive, path }: TProps) {
  const identity = drive.getFileIdentity({ path });
  const isFile = isFilePlaceholderId(identity);

  if (!identity || !isFile) {
    return {
      error: logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'File not found or not a file',
        path,
        identity,
        isFile,
      }),
    };
  }

  return { data: identity };
}
