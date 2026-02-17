import { FileOverrider } from '../application/override/FileOverrider';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { EventBus } from '../../shared/domain/EventBus';

export class FileOverriderTestClass extends FileOverrider {
  readonly mock = vi.fn();

  constructor() {
    super({} as FileRepository, {} as EventBus);
  }

  run(path: File['path'], contentsId: File['contentsId'], size: File['size']) {
    return this.mock(path, contentsId, size);
  }
}
