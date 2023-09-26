import path from 'path';
import { FolderPath } from '../domain/FolderPath';

export class FolderPathFromAbsolutePathCreator {
  constructor(private readonly baseFolder: string) {}

  private calculateRelativePath(basePath: string, folderPath: string): string {
    const relativePath = path.relative(basePath, folderPath);
    const relativeFolders = path.dirname(relativePath);
    const fileName = path.basename(folderPath);

    return path.join(relativeFolders, fileName);
  }

  run(absolutePath: string): FolderPath {
    const relative = this.calculateRelativePath(this.baseFolder, absolutePath);

    const withSlash = path.sep + relative;

    return new FolderPath(withSlash);
  }
}
