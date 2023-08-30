import path from 'path';
import { FilePath } from '../domain/FilePath';

type RootFolderProvider = () => string;

export class FilePathFromAbsolutePathConverter {
  constructor(private readonly provider: RootFolderProvider) {}

  private calculateRelativePath(basePath: string, filePath: string): string {
    const relativePath = path.relative(basePath, filePath);
    const relativeFolders = path.dirname(relativePath);
    const fileName = path.basename(filePath);

    return path.join(relativeFolders, fileName);
  }

  run(absolutePath: string): FilePath {
    const rootFolder = this.provider();
    const relative = this.calculateRelativePath(rootFolder, absolutePath);

    const withSlash = path.sep + relative;

    return new FilePath(withSlash);
  }
}
