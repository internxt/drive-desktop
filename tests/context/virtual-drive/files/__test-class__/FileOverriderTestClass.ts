import { SingleFileMatchingFinder } from '../../../../../src/context/virtual-drive/files/application/SingleFileMatchingFinder';
import { FileOverrider } from '../../../../../src/context/virtual-drive/files/application/override/FileOverrider';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';
import { RemoteFileSystem } from '../../../../../src/context/virtual-drive/files/domain/file-systems/RemoteFileSystem';
import { EventBus } from '../../../../../src/context/virtual-drive/shared/domain/EventBus';

export class FileOverriderTestClass extends FileOverrider {
  readonly mock = jest.fn();

  constructor() {
    super(
      {} as SingleFileMatchingFinder,
      {} as RemoteFileSystem,
      {} as EventBus
    );
  }

  run(path: File['path'], contentsId: File['contentsId'], size: File['size']) {
    return this.mock(path, contentsId, size);
  }
}
