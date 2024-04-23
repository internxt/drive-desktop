import { ServerFile } from '../../../shared/domain/ServerFile';
import { File } from '../../files/domain/File';
import { FileStatuses } from '../../files/domain/FileStatus';

export function createFileFromServerFile(
  server: ServerFile,
  relativePath: string
): File {
  return File.from({
    id: server.id,
    uuid: server.uuid,
    folderId: server.folderId,
    contentsId: server.fileId,
    modificationTime: server.modificationTime,
    size: server.size,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt,
    path: relativePath,
    status: FileStatuses[server.status as 'EXISTS' | 'TRASHED' | 'DELETED'],
  });
}
