import { Service } from 'diod';
import { File } from '../../domain/File';
import { HttpRemoteFileSystem } from '../../infrastructure/HttpRemoteFileSystem';

@Service()
export class FileDeleter {
  constructor(private readonly fs: HttpRemoteFileSystem) {}

  async run(file: File) {
    await this.fs.delete(file);
  }
}
