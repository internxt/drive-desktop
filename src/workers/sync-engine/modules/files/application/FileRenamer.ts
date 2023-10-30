import { EventBus } from '../../shared/domain/EventBus';
import { File } from '../domain/File';
import { FileInternxtFileSystem } from '../domain/FileInternxtFileSystem';
import { FilePath } from '../domain/FilePath';
import { FileRepository } from '../domain/FileRepository';

export class FileRenamer {
  constructor(
    private readonly fileSystem: FileInternxtFileSystem,
    private readonly repository: FileRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(file: File, path: FilePath) {
    file.rename(path);

    await this.fileSystem.rename(file);
    await this.repository.update(file);

    const events = file.pullDomainEvents();
    this.eventBus.publish(events);
  }
}
