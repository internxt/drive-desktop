import { Service } from 'diod';
import { FileSize } from '../../domain/FileSize';
import { File } from '../../domain/File';
import { FileContentsId } from '../../domain/FileContentsId';
import { SDKRemoteFileSystem } from '../../infrastructure/SDKRemoteFileSystem';

@Service()
export class SimpleFileOverrider {
  constructor(private readonly rfs: SDKRemoteFileSystem) {}

  async run(file: File, contentsId: string, size: number): Promise<void> {
    file.changeContents(new FileContentsId(contentsId), new FileSize(size));

    await this.rfs.override(file);
  }
}
