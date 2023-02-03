import {
  FileSystemKind,
  ReadingMetaErrorEntry,
  Source,
  FileSystemProgressCallback,
} from '../../../types';
import { PartialListing } from '../../../sync/Listings/domain/Listing';
import { FileSystem } from '../../domain/FileSystem';

export class FileSystemMock implements FileSystem<PartialListing> {
  private mockGetCurrentListing = jest.fn();

  private mockRenameFile = jest.fn();

  private mockDeleteFile = jest.fn();

  private mockPullFile = jest.fn();

  private mockPullFolder = jest.fn();

  private mockExistsFolder = jest.fn();

  private mockDeleteFolder = jest.fn();

  private mockGetSource = jest.fn();

  private mockSmokeTest = jest.fn();

  public kind: FileSystemKind = 'LOCAL';

  getCurrentListing(): Promise<{
    listing: PartialListing;
    readingMetaErrors: ReadingMetaErrorEntry[];
  }> {
    return this.mockGetCurrentListing();
  }

  renameFile(oldName: string, newName: string): Promise<void> {
    return this.mockRenameFile(oldName, newName);
  }

  deleteFile(name: string): Promise<void> {
    return this.mockDeleteFile(name);
  }

  pullFile(
    name: string,
    source: Source,
    progressCallback: FileSystemProgressCallback
  ): Promise<void> {
    return this.mockPullFile(name, source, progressCallback);
  }

  pullFolder = (name: string): Promise<void> => {
    return this.mockPullFolder(name);
  };

  existsFolder(name: string): Promise<boolean> {
    return this.mockExistsFolder(name);
  }

  deleteFolder = (name: string): Promise<void> => {
    return this.mockDeleteFolder(name);
  };

  getSource(
    name: string,
    progressCallback: FileSystemProgressCallback
  ): Promise<Source> {
    return this.mockGetSource(name, progressCallback);
  }

  smokeTest(): Promise<void> {
    return this.mockSmokeTest();
  }

  assertNumberOfFoldersPulled(n: number) {
    // eslint-disable-next-line jest/no-standalone-expect
    expect(this.mockPullFolder).toBeCalledTimes(n);
  }

  assertOrderOfFoldersPulled(names: Array<string>) {
    names.forEach((name: string, index: number) =>
      // eslint-disable-next-line jest/no-standalone-expect
      expect(this.mockPullFolder).toHaveBeenNthCalledWith(index + 1, name)
    );
  }
}
