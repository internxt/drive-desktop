import { Service } from 'diod';
import { FileSize } from '../../domain/FileSize';
import { File } from '../../domain/File';
import { FileContentsId } from '../../domain/FileContentsId';
import { RemoteFileSystem } from '../../domain/file-systems/RemoteFileSystem';

@Service()
export class SimpleFileOverrider {
  constructor(private readonly rfs: RemoteFileSystem) {}

  async run(file: File, contentsId: string, size: number): Promise<void> {
    file.changeContents(new FileContentsId(contentsId), new FileSize(size));

    await this.rfs.override(file);
  }
}
