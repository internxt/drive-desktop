import { File } from '../domain/File';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';

export class FilesPlaceholderCreator {
  constructor(private readonly local: NodeWinLocalFileSystem) {}

  async run(files: Array<File>) {
    const creationPromises = files.map((file) => this.local.createPlaceHolder(file));
    await Promise.all(creationPromises);
  }
}
