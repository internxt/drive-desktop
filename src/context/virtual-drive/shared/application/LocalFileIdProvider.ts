import { RelativePathToAbsoluteConverter } from './RelativePathToAbsoluteConverter';
import fs from 'fs/promises';

export class LocalFileIdProvider {
  constructor(
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter
  ) {}

  async run(path: string): Promise<string> {
    const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(path);

    const { ino, dev } = await fs.stat(win32AbsolutePath);

    return `${dev}-${ino}`;
  }
}
