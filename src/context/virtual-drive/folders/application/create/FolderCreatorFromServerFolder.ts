import { ServerFolder } from '../../../../shared/domain/ServerFolder';
import { Folder } from '../../domain/Folder';

export function createFolderFromServerFolder(
  server: ServerFolder,
  relativePath: string
): Folder {
  const path = relativePath.replaceAll('//', '/');

  return Folder.from({
    id: server.id,
    uuid: server.uuid,
    parentId: server.parentId as number,
    updatedAt: server.updatedAt,
    createdAt: server.createdAt,
    path: path,
    status: server.status,
  });
}
