import { File } from '../domain/File';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';

export class FilePlaceholderConverter {
  constructor(private readonly localFileSystem: NodeWinLocalFileSystem) {}

  run(file: File) {
    this.localFileSystem.convertToPlaceholder(file);
  }
}
