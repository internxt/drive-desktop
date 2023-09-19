import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalFileWriter } from '../domain/LocalFileWriter';
import path from 'path';
import { ensureFolderExists } from '../../../../../shared/fs/ensure-folder-exists';
import { WriteReadableToFile } from 'shared/fs/write-readable-to-file';

export class FSLocalFileProvider implements LocalFileWriter {
  constructor(private readonly where: string) {}

  private folderPath = () => path.join(this.where, 'internxt');
  private filePath = (file: string) => path.join(this.folderPath(), file);

  async write(contents: LocalFileContents): Promise<string> {
    ensureFolderExists(this.folderPath());
    const filePath = this.filePath(contents.nameWithExtension);

    await WriteReadableToFile.write(contents.stream, filePath);

    return filePath;
  }
}
