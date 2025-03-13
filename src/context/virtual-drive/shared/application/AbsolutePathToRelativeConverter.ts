import { win32 } from 'path';

export class AbsolutePathToRelativeConverter {
  constructor(private readonly baseFolder: string) {}

  private calculateRelativePath(basePath: string, folderPath: string): string {
    const relativePath = win32.relative(basePath, folderPath);
    const relativeFolders = win32.dirname(relativePath);
    const fileName = win32.basename(folderPath);

    return win32.join(relativeFolders, fileName);
  }

  run(absolutePath: string): string {
    const normalized = win32.normalize(absolutePath);
    const relative = this.calculateRelativePath(this.baseFolder, normalized);

    return win32.sep + relative;
  }
}
