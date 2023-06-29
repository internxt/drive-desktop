import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { FilePath } from '../domain/FilePath';
import { RemoteFileContentsRepository } from '../domain/RemoteFileContentsRepository';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { Stopwatch } from '../../../../../shared/types/Stopwatch';
import { WebdavIpc } from '../../../ipc';
import { ContentFileClonner } from '../domain/ContentFileClonner';

export class WebdavFileClonner {
  private static FILE_OVERRIDED = true;
  private static FILE_NOT_OVERRIDED = false;

  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly contentRepository: RemoteFileContentsRepository,
    private readonly eventBus: WebdavServerEventBus,
    private readonly ipc: WebdavIpc
  ) {}

  private registerEvents(clonner: ContentFileClonner, file: WebdavFile) {
    const stopwatch = new Stopwatch();

    clonner.on('start', () => {
      stopwatch.start();
    });

    clonner.on('finish', () => {
      stopwatch.finish();

      this.ipc.send('WEBDAV_FILE_CLONNED', {
        name: file.name,
        type: file.type,
        size: file.size,
        processInfo: { elapsedTime: stopwatch.elapsedTime() },
      });
    });
  }

  private async overwrite(
    file: WebdavFile,
    fileOverwritted: WebdavFile,
    destinationPath: FilePath
  ) {
    const destinationFolder = this.folderFinder.run(fileOverwritted.dirname);

    const clonner = this.contentRepository.clonner(file);

    this.registerEvents(clonner, file);

    const clonnedFileId = await clonner.clone();

    const newFile = file.overwrite(
      clonnedFileId,
      destinationFolder.id,
      destinationPath
    );

    fileOverwritted.trash();

    try {
      await this.repository.delete(fileOverwritted);
      await this.repository.add(newFile);

      await this.eventBus.publish(newFile.pullDomainEvents());
      await this.eventBus.publish(fileOverwritted.pullDomainEvents());
    } catch (err: unknown) {
      if (!(err instanceof Error)) {
        throw new Error(`${err} was thrown`);
      }
    }
  }

  private async copy(file: WebdavFile, path: FilePath) {
    const destinationFolder = this.folderFinder.run(path.dirname());

    const clonner = this.contentRepository.clonner(file);

    this.registerEvents(clonner, file);

    const clonnedFileId = await clonner.clone();

    const clonned = file.clone(clonnedFileId, destinationFolder.id, path);

    await this.repository.add(clonned);

    await this.eventBus.publish(clonned.pullDomainEvents());
  }

  async run(
    originFile: WebdavFile,
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
      return WebdavFileClonner.FILE_OVERRIDED;
    }

    await this.copy(originFile, destinationPath);
    return WebdavFileClonner.FILE_NOT_OVERRIDED;
  }
}
