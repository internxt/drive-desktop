import { LocalFile } from '../../../../../src/context/local/localFile/domain/LocalFile';
import { LocalFileRepository } from '../../../../../src/context/local/localFile/domain/LocalFileRepository';
import { AbsolutePath } from '../../../../../src/context/local/localFile/infrastructure/AbsolutePath';

export class LocalFileRepositoryMock implements LocalFileRepository {
  private readonly filesMock = jest.fn();
  private readonly foldersMock = jest.fn();

  files(absolutePath: AbsolutePath): Promise<LocalFile[]> {
    return this.filesMock(absolutePath);
  }

  returnsFiles(files: LocalFile | Array<LocalFile>) {
    if (Array.isArray(files)) {
      this.filesMock.mockResolvedValueOnce(files);
      return;
    }

    this.filesMock.mockResolvedValueOnce([files]);
  }

  assertFilesHasBeenCalledWith(folder: AbsolutePath) {
    expect(this.filesMock).toHaveBeenCalledWith(folder);
  }

  folders(absolutePath: AbsolutePath): Promise<AbsolutePath[]> {
    return this.foldersMock(absolutePath);
  }

  returnsFolders(paths: Array<AbsolutePath>) {
    this.foldersMock.mockResolvedValueOnce(paths);
  }

  withOutFolders() {
    this.foldersMock.mockResolvedValue([]);
  }

  assertFoldersHasBeenCalledWith(folder: AbsolutePath) {
    expect(this.foldersMock).toHaveBeenCalledWith(folder);
  }
}
