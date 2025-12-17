import { FileCreator } from '../application/create/FileCreator';
import { FileTrasher } from '../application/trash/FileTrasher';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { SyncFileMessenger } from '../domain/SyncFileMessenger';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { ParentFolderFinder } from '../../folders/application/ParentFolderFinder';
import { EventBus } from '../../shared/domain/EventBus';

export class FileCreatorTestClass extends FileCreator {
  public readonly mock = vi.fn();

  constructor() {
    super(
      {} as RemoteFileSystem,
      {} as FileRepository,
      {} as ParentFolderFinder,
      {} as FileTrasher,
      {} as EventBus,
      {} as SyncFileMessenger,
    );
  }

  run(path: string, contentsId: string, size: number): Promise<File> {
    return this.mock(path, contentsId, size);
  }
}
