import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { moveItem } from './move-item';
import { Watcher } from '@/node-win/watcher/watcher';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

type TProps = {
  self: Watcher;
  path: RelativePath;
  uuid: FileUuid;
};

export async function moveFile({ self, path, uuid }: TProps) {
  try {
    const { data: file } = await ipcRendererSqlite.invoke('fileGetByUuid', { uuid });

    const item = file ? { oldParentUuid: file.parentUuid, oldName: file.nameWithExtension } : undefined;

    await moveItem({ self, path, uuid, item, type: 'file' });
  } catch (exc) {
    self.logger.error({ msg: 'Error moving file', path, uuid, exc });
  }
}
