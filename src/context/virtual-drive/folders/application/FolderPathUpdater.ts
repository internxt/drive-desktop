import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderPath } from '../domain/FolderPath';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { InMemoryFolderRepository } from '../infrastructure/InMemoryFolderRepository';
import { FolderMover } from './FolderMover';
import { FolderRenamer } from './FolderRenamer';

export class FolderPathUpdater {
  constructor(
    private readonly repository: InMemoryFolderRepository,
    private readonly folderMover: FolderMover,
    private readonly folderRenamer: FolderRenamer,
  ) {}

  async run({ uuid, path, action }: { uuid: string; path: RelativePath; action: 'rename' | 'move' }) {
    const folder = this.repository.searchByPartial({ uuid });

    if (!folder) {
      throw new FolderNotFoundError(uuid);
    }

    const desiredPath = new FolderPath(path);

    if (action === 'move') {
      return await this.folderMover.run(folder, desiredPath);
    }

    if (action === 'rename') {
      return await this.folderRenamer.run(folder, desiredPath);
    }
  }
}
