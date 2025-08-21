import { components } from '../../../infra/schemas';
import { FolderPersistedDto } from '../folders/domain/file-systems/RemoteFileSystem';

export function mapToFolderPersistedDto(
  folderDto: components['schemas']['FolderDto']
): FolderPersistedDto {
  return {
    id: folderDto.id,
    uuid: folderDto.uuid,
    parentId: folderDto.parentId,
    updatedAt: folderDto.updatedAt,
    createdAt: folderDto.createdAt,
  };
}
