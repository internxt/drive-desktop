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
      rootUuid: getConfig().rootUuid,
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

    const folder = Folder.from(attributes);

    this.repository.add(folder);

    this.virtualDrive.convertToPlaceholder({
      itemPath: folder.path,
      id: folder.placeholderId,
    });

    return folder;
  }
}
