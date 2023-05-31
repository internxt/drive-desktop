import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { FilePath } from '../domain/FilePath';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import { FileClonner } from '../infrastructure/FileClonner';

export class WebdavFileClonner {
  private static FILE_OVERRIDED = true;
  private static FILE_NOT_OVERRIDED = false;

  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly fileClonner: FileClonner
  ) {}

  private async overwrite(file: WebdavFile, destinationFile: WebdavFile) {
    const clonnedFileId = await this.fileClonner.clone(file.fileId);
    const newFile = destinationFile.override(file, clonnedFileId);

    await this.repository.delete(destinationFile);
    await this.repository.add(newFile);
  }

  private async copy(file: WebdavFile, path: FilePath) {
    const clonnedFileId = await this.fileClonner.clone(file.fileId);

    const destinationFolder = this.folderFinder.run(path.dirname());

    if (!destinationFolder) {
      throw new Error('Folder not found');
    }

    const newFile = WebdavFile.from({
      fileId: clonnedFileId,
      size: file.size,
      type: file.type,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      modificationTime: file.modificationTime.toISOString(),
      folderId: destinationFolder.id,
      name: path.name(),
      path: path.value,
    });

    await this.repository.add(newFile);
  }

  async run(
    origin: FilePath,
    destination: FilePath,
    overwrite: boolean
  ): Promise<boolean> {
    const originFile = this.repository.search(origin.value);

    if (!originFile) {
      throw new Error('File not found');
    }

    const destinationFile = this.repository.search(destination.toString());

    if (destinationFile && !overwrite) {
      throw new Error('File already exists');
    }

    if (destinationFile) {
      await this.overwrite(originFile, destinationFile);
      return WebdavFileClonner.FILE_OVERRIDED;
    }

    await this.copy(originFile, destination);
    return WebdavFileClonner.FILE_NOT_OVERRIDED;
  }
}
