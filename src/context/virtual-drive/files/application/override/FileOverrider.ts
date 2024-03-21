import { ContentsId } from '../../../contents/domain/ContentsId';
import { EventBus } from '../../../shared/domain/EventBus';
import { File } from '../../domain/File';
import { FileRepository } from '../../domain/FileRepository';
import { FileSize } from '../../domain/FileSize';
import { FileNotFoundError } from '../../domain/errors/FileNotFoundError';
import { RemoteFileSystem } from '../../domain/file-systems/RemoteFileSystem';

export class FileOverrider {
  constructor(
    private readonly repository: FileRepository,
    private readonly rfs: RemoteFileSystem,
    private readonly eventBus: EventBus
  ) {}

  async run(
    fileId: File['id'],
    contentsId: File['contentsId'],
    size: File['size']
  ): Promise<void> {
    const file = await this.repository.searchById(fileId);

    if (!file) {
      throw new FileNotFoundError(fileId);
    }

    const newContentsId = new ContentsId(contentsId);
    const newSize = new FileSize(size);

    file.changeContents(newContentsId, newSize);

    this.rfs.override(file);

    this.eventBus.publish(file.pullDomainEvents());
  }
}
