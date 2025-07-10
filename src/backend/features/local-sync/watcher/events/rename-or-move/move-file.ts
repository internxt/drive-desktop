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

    let oldName: string | undefined;
    let oldParentUuid: string | undefined;

    if (file) {
      oldParentUuid = file.parentUuid;
      oldName = file.nameWithExtension;
    }

    await moveItem({ self, path, uuid, oldName, oldParentUuid, type: 'file' });
  } catch (exc) {
    self.logger.error({ msg: 'Error moving file', path, uuid, exc });
  }
}
