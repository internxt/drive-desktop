import { FolderFinder } from '../../folders/application/FolderFinder';
import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FileSize } from '../domain/FileSize';
import { EventBus } from '../../shared/domain/WebdavServerEventBus';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { FileDeleter } from './FileDeleter';
import { PlatformPathConverter } from '../../shared/test/helpers/PlatformPathConverter';

export class FileCreator {
  constructor(
    private readonly repository: FileRepository,
    private readonly folderFinder: FolderFinder,
    private readonly fileDeleter: FileDeleter,
    private readonly eventBus: EventBus
  ) {}

  async run(
    filePath: FilePath,
    fileContents: RemoteFileContents
  ): Promise<File> {
    const existingFile = this.repository.searchByPartial({
      path: PlatformPathConverter.winToPosix(filePath.value),
    });

    if (existingFile) {
      await this.fileDeleter.act(existingFile);
    }

    const contentsId = fileContents.id;
    const size = new FileSize(fileContents.size);

    const folder = this.folderFinder.findFromFilePath(filePath);

    const file = File.create(contentsId, folder, size, filePath);

    await this.repository.add(file);

    await this.eventBus.publish(file.pullDomainEvents());

    return file;
  }
}
