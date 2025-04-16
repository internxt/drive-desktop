import { ServerFolder } from '../../../../shared/domain/ServerFolder';
import { Folder } from '../../domain/Folder';

export function createFolderFromServerFolder(server: ServerFolder, relativePath: string): Folder {
  const path = relativePath.replaceAll('//', '/');

  return Folder.from({
    id: server.id,
    uuid: server.uuid,
    parentId: server.parentId as number,
    parentUuid: server.parentUuid || null,
    updatedAt: server.updatedAt,
    createdAt: server.createdAt,
    path,
    status: server.status,
  });
}
