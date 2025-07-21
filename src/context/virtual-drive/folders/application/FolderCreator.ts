import { Service } from 'diod';
import { HttpRemoteFolderSystem } from '../infrastructure/HttpRemoteFolderSystem';
import VirtualDrive from '@/node-win/virtual-drive';
import { posix } from 'path';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { getConfig } from '@/apps/sync-engine/config';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type TProps = {
  path: RelativePath;
};

@Service()
export class FolderCreator {
  constructor(
    private readonly remote: HttpRemoteFolderSystem,
    private readonly virtualDrive: VirtualDrive,
  ) {}

  async run({ path }: TProps) {
    const posixDir = pathUtils.dirname(path);
    const { data: parentUuid } = NodeWin.getFolderUuid({
      drive: this.virtualDrive,
      path: posixDir,
    });

    if (!parentUuid) {
      throw new FolderNotFoundError(posixDir);
    }

    const folderDto = await this.remote.persist({
      parentUuid,
      plainName: posix.basename(path),
      path,
    });

    const { error } = await ipcRendererSqlite.invoke('folderCreateOrUpdate', {
      folder: {
        ...folderDto,
        userUuid: getConfig().userUuid,
        workspaceId: getConfig().workspaceId,
        updatedAt: '2000-01-01T00:00:00Z',
      },
    });

    if (error) throw error;

    this.virtualDrive.convertToPlaceholder({
      itemPath: path,
      id: `FOLDER:${folderDto.uuid}`,
    });
  }
}
