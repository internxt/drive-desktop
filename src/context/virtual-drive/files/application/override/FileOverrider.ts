import { ContentsId } from '../../../contents/domain/ContentsId';
import { EventBus } from '../../../shared/domain/EventBus';
import { File } from '../../domain/File';
import { FileSize } from '../../domain/FileSize';
import { FileStatuses } from '../../domain/FileStatus';
import { FileNotFoundError } from '../../domain/errors/FileNotFoundError';
import { RemoteFileSystem } from '../../domain/file-systems/RemoteFileSystem';
import { SingleFileMatchingFinder } from '../SingleFileMatchingFinder';

export class FileOverrider {
  constructor(
    private readonly finder: SingleFileMatchingFinder,
    private readonly rfs: RemoteFileSystem,
    private readonly eventBus: EventBus
  ) {}

  async run(
    path: File['path'],
    contentsId: File['contentsId'],
    size: File['size']
  ): Promise<void> {
    const file = await this.finder.run({
      path,
      status: FileStatuses.EXISTS,
    });

    if (!file) {
      throw new FileNotFoundError(path);
    }

    const newContentsId = new ContentsId(contentsId);
    const newSize = new FileSize(size);

    file.changeContents(newContentsId, newSize);

    this.rfs.override(file);

    this.eventBus.publish(file.pullDomainEvents());
  }
}
