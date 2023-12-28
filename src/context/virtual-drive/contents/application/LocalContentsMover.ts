import { ContentsId } from '../domain/ContentsId';
import { LocalFileSystem } from '../domain/LocalFileSystem';

export class LocalContentsMover {
  constructor(private readonly fileSystem: LocalFileSystem) {}

  async run(contentsId: string, src: string): Promise<void> {
    const exists = await this.fileSystem.exists(contentsId);

    if (exists) {
      this.fileSystem.remove(contentsId);
    }

    const id = new ContentsId(contentsId);

    await this.fileSystem.add(id, src);
  }
}
