import { FileNotFoundError } from '../domain/errors/FileNotFoundError';
import { File } from '../domain/File';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';

export class FilePlaceholderCreatorFromContentsId {
  constructor(
    private readonly repository: InMemoryFileRepository,
    private readonly local: NodeWinLocalFileSystem,
  ) {}

  run(uuid: File['uuid']) {
    const file = this.repository.searchByPartial({ uuid });
    if (!file) {
      throw new FileNotFoundError(uuid);
    }

    this.local.createPlaceHolder(file);
  }
}
