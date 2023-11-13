import { ServerFolder } from '../../../shared/domain/ServerFolder';
import { Folder } from '../../folders/domain/Folder';

export function createFolderFromServerFolder(
  server: ServerFolder,
  relativePath: string
): Folder {
  return Folder.from({
    id: server.id,
    uuid: server.uuid,
    parentId: server.parentId as number,
    updatedAt: server.updatedAt,
    createdAt: server.createdAt,
    path: relativePath,
    status: server.status,
  });
}
