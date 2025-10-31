import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { getFileIdentity } from './get-file-identity';
import VirtualDrive from '@/node-win/virtual-drive';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { trimPlaceholderId } from '@/apps/sync-engine/callbacks-controllers/controllers/placeholder-id';

type TProps = {
  drive: VirtualDrive;
  path: string;
};

export function getFileUuidFromPlaceholder({ placeholderId }: { placeholderId: FilePlaceholderId }) {
  placeholderId = trimPlaceholderId({ placeholderId });
  return placeholderId.split(':')[1] as FileUuid;
}

export function getFileUuid({ drive, path }: TProps) {
  const identity = getFileIdentity({ drive, path });

  if (identity.error) {
    return { error: identity.error };
  }

  return { data: getFileUuidFromPlaceholder({ placeholderId: identity.data }) };
}
