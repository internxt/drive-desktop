import { Service } from 'diod';
import { Folder } from '../domain/Folder';
import { HttpRemoteFolderSystem } from '../infrastructure/HttpRemoteFolderSystem';
import { InMemoryFolderRepository } from '../infrastructure/InMemoryFolderRepository';
import VirtualDrive from '@/node-win/virtual-drive';
import { posix } from 'path';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { getConfig } from '@/apps/sync-engine/config';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';

type TProps = {
  path: string;
};

@Service()
export class FolderCreator {
  constructor(
    private readonly repository: InMemoryFolderRepository,
    private readonly remote: HttpRemoteFolderSystem,
    private readonly virtualDrive: VirtualDrive,
  ) {}

  async run({ path }: TProps): Promise<Folder> {
    const posixDir = PlatformPathConverter.getFatherPathPosix(path);
    const { data: parentUuid } = NodeWin.getFolderUuid({
      drive: this.virtualDrive,
      path: posixDir,
    });

    if (!parentUuid) {
      throw new FolderNotFoundError(posixDir);
    }

    const attributes = await this.remote.persist({
      parentUuid,
      basename: posix.basename(path),
      path,
    });

    const { error } = await ipcRendererSqlite.invoke('folderCreateOrUpdate', {
      folder: {
        ...attributes.dto,
        userUuid: getConfig().userUuid,
        workspaceId: getConfig().workspaceId,
        updatedAt: '2000-01-01T00:00:00Z',
      },
    });

    if (error) throw error;

    const folder = Folder.from(attributes);
    this.repository.add(folder);

    this.virtualDrive.convertToPlaceholder({
      itemPath: folder.path,
      id: folder.placeholderId,
    });

    return folder;
  }
}
