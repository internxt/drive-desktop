import path from 'path';

export class AbsolutePathToRelativeConverter {
  constructor(private readonly baseFolder: string) {}

  private calculateRelativePath(basePath: string, folderPath: string): string {
    const relativePath = path.relative(basePath, folderPath);
    const relativeFolders = path.dirname(relativePath);
    const fileName = path.basename(folderPath);

    return path.join(relativeFolders, fileName);
  }

  run(absolutePath: string): string {
    const normalized = path.normalize(absolutePath);
    const relative = this.calculateRelativePath(this.baseFolder, normalized);

    return path.win32.sep + relative;
  }
}
