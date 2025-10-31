import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { trimPlaceholderId } from '@/apps/sync-engine/callbacks-controllers/controllers/placeholder-id';

export function getFileUuidFromPlaceholder({ placeholderId }: { placeholderId: FilePlaceholderId }) {
  placeholderId = trimPlaceholderId({ placeholderId });
  return placeholderId.split(':')[1] as FileUuid;
}
