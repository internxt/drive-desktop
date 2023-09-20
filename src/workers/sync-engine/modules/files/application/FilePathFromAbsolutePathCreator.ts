import path from 'path';
import { FilePath } from '../domain/FilePath';

export class FilePathFromAbsolutePathCreator {
  constructor(private readonly baseFolder: string) {}

  private calculateRelativePath(basePath: string, filePath: string): string {
    const relativePath = path.relative(basePath, filePath);
    const relativeFolders = path.dirname(relativePath);
    const fileName = path.basename(filePath);

    return path.join(relativeFolders, fileName);
  }

  run(absolutePath: string): FilePath {
    const relative = this.calculateRelativePath(this.baseFolder, absolutePath);

    const withSlash = path.sep + relative;

    return new FilePath(withSlash);
  }
}
