import { Service } from 'diod';
import { File } from '../../domain/File';
import { SDKRemoteFileSystem } from '../../infrastructure/SDKRemoteFileSystem';

@Service()
export class FileDeleter {
  constructor(private readonly fs: SDKRemoteFileSystem) {}

  async run(file: File) {
    await this.fs.delete(file);
  }
}
