import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { trimPlaceholderId } from '@/apps/sync-engine/callbacks-controllers/controllers/placeholder-id';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';

type Props = { placeholderId: FilePlaceholderId };

export function getFileUuidFromPlaceholder({ placeholderId }: Props) {
  placeholderId = trimPlaceholderId({ placeholderId });
  return placeholderId.split(':')[1] as FileUuid;
}
