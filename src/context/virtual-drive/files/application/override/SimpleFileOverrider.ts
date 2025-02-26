import { Service } from 'diod';
import { FileSize } from '../../domain/FileSize';
import { File } from '../../domain/File';
import { FileContentsId } from '../../domain/FileContentsId';
import { HttpRemoteFileSystem } from '../../infrastructure/HttpRemoteFileSystem';

@Service()
export class SimpleFileOverrider {
  constructor(private readonly rfs: HttpRemoteFileSystem) {}

  async run(file: File, contentsId: string, size: number): Promise<void> {
    file.changeContents(new FileContentsId(contentsId), new FileSize(size));

    await this.rfs.override(file);
  }
}
