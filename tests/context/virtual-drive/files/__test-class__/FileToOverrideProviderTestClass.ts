import { FileToOverrideProvider } from '../../../../../src/context/virtual-drive/files/application/FileToOverrideProvider';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';
import { FileRepository } from '../../../../../src/context/virtual-drive/files/domain/FileRepository';
import { EventRepository } from '../../../../../src/context/virtual-drive/shared/domain/EventRepository';
import { Optional } from '../../../../../src/shared/types/Optional';

export class FileToOverrideProviderTestClass extends FileToOverrideProvider {
  readonly mock = jest.fn();

  constructor() {
    super({} as EventRepository, {} as FileRepository);
  }

  run(): Promise<Optional<File>> {
    return this.mock();
  }
}
