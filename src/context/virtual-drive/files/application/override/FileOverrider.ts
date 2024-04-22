import { Service } from 'diod';
import { ContentsId } from '../../../contents/domain/ContentsId';
import { EventBus } from '../../../shared/domain/EventBus';
import { File } from '../../domain/File';
import { FileRepository } from '../../domain/FileRepository';
import { FileSize } from '../../domain/FileSize';
import { FileNotFoundError } from '../../domain/errors/FileNotFoundError';
import { RemoteFileSystem } from '../../domain/file-systems/RemoteFileSystem';

@Service()
export class FileOverrider {
  constructor(
    private readonly rfs: RemoteFileSystem,
    private readonly repository: FileRepository,
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

    file.changeContents(new ContentsId(newContentsId), new FileSize(newSize));

    await this.rfs.override(file);

    await this.repository.update(file);

    this.eventBus.publish(file.pullDomainEvents());
  }
}
