import path from 'path';
import { FolderPath } from '../domain/FolderPath';

export class FolderPathCreator {
  constructor(private readonly baseFolder: string) {}

  private calculateRelativePath(basePath: string, folderPath: string): string {
    const relativePath = path.relative(basePath, folderPath);
    const relativeFolders = path.dirname(relativePath);
    const fileName = path.basename(folderPath);

    return path.join(relativeFolders, fileName);
  }

  fromAbsolute(absolutePath: string): FolderPath {
    // TODO: path.normalize can be better fit
    const sanitized = absolutePath.replace('\\\\', '\\');
    const relative = this.calculateRelativePath(this.baseFolder, sanitized);

    const withSlash = path.sep + relative;
    return new FolderPath(withSlash);
  }
}
