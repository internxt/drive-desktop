import { FolderDto } from '../../../infra/drive-server/out/dto';
import { FolderPersistedDto } from '../folders/domain/file-systems/RemoteFileSystem';

export function mapToFolderPersistedDto(folderDto: FolderDto): FolderPersistedDto {
  return {
    id: folderDto.id,
    uuid: folderDto.uuid,
    parentId: folderDto.parentId,
    updatedAt: folderDto.updatedAt,
    createdAt: folderDto.createdAt,
  };
}
