import { Service } from 'diod';
import { EventBus } from '../../../shared/domain/EventBus';
import { File } from '../../domain/File';
import { FileSize } from '../../domain/FileSize';
import { FileNotFoundError } from '../../domain/errors/FileNotFoundError';
import { FileContentsId } from '../../domain/FileContentsId';
import { InMemoryFileRepository } from '../../infrastructure/InMemoryFileRepository';
import { SDKRemoteFileSystem } from '../../infrastructure/SDKRemoteFileSystem';

@Service()
export class FileOverrider {
  constructor(
    private readonly rfs: SDKRemoteFileSystem,
    private readonly repository: InMemoryFileRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    oldContentsId: File['contentsId'],
    newContentsId: File['contentsId'],
    newSize: File['size']
  ): Promise<void> {
    const file = await this.repository.searchByContentsId(oldContentsId);

    if (!file) {
      throw new FileNotFoundError(oldContentsId);
    }

    file.changeContents(
      new FileContentsId(newContentsId),
      new FileSize(newSize)
    );

    await this.rfs.override(file);

    await this.repository.update(file);

    this.eventBus.publish(file.pullDomainEvents());
  }
}
