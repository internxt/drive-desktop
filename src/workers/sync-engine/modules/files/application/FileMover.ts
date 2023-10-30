import { FolderFinder } from '../../folders/application/FolderFinder';
import { LocalFileIdProvider } from '../../shared/application/LocalFileIdProvider';
import { EventBus } from '../../shared/domain/EventBus';
import { File } from '../domain/File';
import { FileInternxtFileSystem } from '../domain/FileInternxtFileSystem';
import { FilePath } from '../domain/FilePath';
import { FileRepository } from '../domain/FileRepository';

export class FileMover {
  constructor(
    private readonly localFileIdProvider: LocalFileIdProvider,
    private readonly folderFinder: FolderFinder,
    private readonly fileSystem: FileInternxtFileSystem,
    private readonly repository: FileRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(file: File, destination: FilePath) {
    const trackerId = await this.localFileIdProvider.run(file.path.value);
    const destinationFolder = this.folderFinder.run(destination.dirname());

    file.move(destinationFolder, trackerId);

    await this.fileSystem.move(file);
    await this.repository.update(file);

    await this.eventBus.publish(file.pullDomainEvents());
  }
}
