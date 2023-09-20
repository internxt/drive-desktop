import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { FilePath } from '../domain/FilePath';
import { ContentsManagersFactory } from '../../contents/domain/ContentsManagersFactory';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';
import { ContentFileCloner } from '../../contents/domain/contentHandlers/ContentFileCloner';

export class WebdavFileCloner {
  private static FILE_OVERRIDDEN = true;
  private static FILE_NOT_OVERRIDDEN = false;

  constructor(
    private readonly repository: FileRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly contentRepository: ContentsManagersFactory,
    private readonly eventBus: WebdavServerEventBus,
    private readonly ipc: SyncEngineIpc
  ) {}

  private registerEvents(cloner: ContentFileCloner, file: File) {
    cloner.on('finish', () => {
      this.ipc.send('FILE_CLONED', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        size: file.size,
        processInfo: { elapsedTime: cloner.elapsedTime() },
      });
    });
  }

  private async overwrite(
    file: File,
    fileOverwritten: File,
    destinationPath: FilePath
  ) {
    const destinationFolder = this.folderFinder.run(fileOverwritten.dirname);

    const cloner = this.contentRepository.cloner(file);

    this.registerEvents(cloner, file);

    const clonedFileId = await cloner.clone();

    const newFile = file.overwrite(
      clonedFileId.value,
      destinationFolder.id,
      destinationPath
    );

    fileOverwritten.trash();

    try {
      await this.repository.delete(fileOverwritten);
      await this.repository.add(newFile);

      await this.eventBus.publish(newFile.pullDomainEvents());
      await this.eventBus.publish(fileOverwritten.pullDomainEvents());
    } catch (err: unknown) {
      if (!(err instanceof Error)) {
        throw new Error(`${err} was thrown`);
      }
    }
  }

  private async copy(file: File, path: FilePath) {
    const destinationFolder = this.folderFinder.run(path.dirname());

    const cloner = this.contentRepository.cloner(file);

    this.registerEvents(cloner, file);

    const clonedFileId = await cloner.clone();

    const cloned = file.clone(clonedFileId.value, destinationFolder.id, path);

    await this.repository.add(cloned);

    await this.eventBus.publish(cloned.pullDomainEvents());
  }

  async run(
    originFile: File,
    destination: string,
    overwrite: boolean
  ): Promise<boolean> {
    const destinationPath = new FilePath(destination);

    const destinationFile = this.repository.search(destinationPath);

    if (destinationFile && !overwrite) {
      throw new FileAlreadyExistsError(destination);
    }

    if (destinationFile) {
      await this.overwrite(originFile, destinationFile, destinationPath);
      return WebdavFileCloner.FILE_OVERRIDDEN;
    }

    await this.copy(originFile, destinationPath);
    return WebdavFileCloner.FILE_NOT_OVERRIDDEN;
  }
}
