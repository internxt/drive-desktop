import { File } from '../domain/File';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';

export class FilePlaceholderConverter {
  constructor(private readonly localFileSystem: NodeWinLocalFileSystem) {}

  async run(file: File) {
    await this.localFileSystem.convertToPlaceholder(file);
  }
}
