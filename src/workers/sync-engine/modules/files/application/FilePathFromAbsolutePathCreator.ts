import path from 'path';
import { FilePath } from '../domain/FilePath';

export class FilePathFromAbsolutePathCreator {
  constructor(private readonly baseFolder: string) {}

  private calculateRelativePath(basePathString: string, filePathString: string): string {
    const basePath = path.parse(basePathString);
    const filePath = path.parse(filePathString);

    if (!filePath.root || filePath.root.length === 0 || filePath.root === '\\') {
      filePath.root = basePath.root;
      filePath.dir = path.join(basePath.root, filePath.dir);
    }

    const fixedFilePath = path.join(filePath.dir + path.sep + filePath.base);

    const relativePath = path.relative(basePathString, fixedFilePath);
    const relativeFolders = path.dirname(relativePath);

    return path.join(relativeFolders, filePath.base);
  }

  run(absolutePath: string): FilePath {
    const relative = this.calculateRelativePath(this.baseFolder, absolutePath);

    const withSlash = path.sep + relative;

    return new FilePath(withSlash);
  }
}
