import { LocalFile } from '../domain/LocalFile';
import { LocalFileRepository } from '../domain/LocalFileRepository';
import { AbsolutePath } from '../infrastructure/AbsolutePath';

export class LocalFileRepositoryMock implements LocalFileRepository {
  private readonly filesMock = vi.fn();
  private readonly foldersMock = vi.fn();

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
