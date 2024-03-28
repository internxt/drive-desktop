import { FileCreator } from '../../../../../src/context/virtual-drive/files/application/FileCreator';
import { FileDeleter } from '../../../../../src/context/virtual-drive/files/application/FileDeleter';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';
import { FileRepository } from '../../../../../src/context/virtual-drive/files/domain/FileRepository';
import { SyncFileMessenger } from '../../../../../src/context/virtual-drive/files/domain/SyncFileMessenger';
import { RemoteFileSystem } from '../../../../../src/context/virtual-drive/files/domain/file-systems/RemoteFileSystem';
import { ParentFolderFinder } from '../../../../../src/context/virtual-drive/folders/application/ParentFolderFinder';
import { EventBus } from '../../../../../src/context/virtual-drive/shared/domain/EventBus';

export class FileCreatorTestClass extends FileCreator {
  public readonly mock = jest.fn();

  constructor() {
    super(
      {} as RemoteFileSystem,
      {} as FileRepository,
      {} as ParentFolderFinder,
      {} as FileDeleter,
      {} as EventBus,
      {} as SyncFileMessenger
    );
  }

  run(path: string, contentsId: string, size: number): Promise<File> {
    return this.mock(path, contentsId, size);
  }
}
