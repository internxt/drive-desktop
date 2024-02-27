import { ServerFile } from '../../../shared/domain/ServerFile';
import { File } from '../domain/File';
import { FileStatuses } from '../domain/FileStatus';

export function createFileFromServerFile(
  server: ServerFile,
  relativePath: string
): File {
  return File.from({
    id: server.id,
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
