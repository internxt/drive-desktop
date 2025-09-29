import path from 'node:path';

export class RelativePathToAbsoluteConverter {
  constructor(private readonly baseFolder: string) {}

  run(relativePath: string): string {
    return path.join(this.baseFolder, relativePath);
  }
}
