import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';
import { FilePath } from '../domain/FilePath';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getConfig } from '@/apps/sync-engine/config';

type PersistAndIndexParams = {
  remote: HttpRemoteFileSystem;
  folderUuid: string;
  filePath: FilePath;
  contents: RemoteFileContents;
  absolutePath: AbsolutePath;
};

export async function persistAndIndex({ remote, folderUuid, filePath, contents, absolutePath }: PersistAndIndexParams) {
  const fileDto = await remote.persist({
    contentsId: contents.id,
    folderUuid,
    path: filePath.value,
    size: contents.size,
  });

  const cfg = getConfig();

  const { error } = await ipcRendererSqlite.invoke('fileCreateOrUpdate', {
    file: {
      ...fileDto,
      size: Number(fileDto.size),
      isDangledStatus: false,
      userUuid: cfg.userUuid,
      workspaceId: cfg.workspaceId,
    },
    bucket: cfg.bucket,
    absolutePath,
  });

  if (error) throw error;

  return fileDto;
}
