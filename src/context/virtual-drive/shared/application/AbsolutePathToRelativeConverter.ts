import path from 'path';

export class AbsolutePathToRelativeConverter {
  constructor(private readonly baseFolder: string) {}

  private calculateRelativePath(basePath: string, folderPath: string): string {
    const relativePath = path.win32.relative(basePath, folderPath);
    const relativeFolders = path.win32.dirname(relativePath);
    const fileName = path.win32.basename(folderPath);

    return path.win32.join(relativeFolders, fileName);
  }

  run(absolutePath: string): string {
    const normalized = path.normalize(absolutePath);
    const relative = this.calculateRelativePath(this.baseFolder, normalized);

    return path.win32.sep + relative;
  }
}
