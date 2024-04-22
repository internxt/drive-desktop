import { File } from '../domain/File';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';
import { Uuid } from '../../../shared/domain/value-objects/Uuid';
import { Service } from 'diod';

@Service()
export class FuseLocalFileSystem implements LocalFileSystem {
  async createPlaceHolder(_file: File): Promise<void> {
    // no-op
  }

  async getLocalFileId(_file: File): Promise<`${string}-${string}`> {
    const ino = Uuid.random().value;
    const dev = Uuid.random().value;

    return `${dev}-${ino}`;
  }
}
