import { ensureFolderExists } from '../../../../apps/shared/fs/ensure-folder-exists';
import { WriteReadableToFile } from '../../../../apps/shared/fs/write-readable-to-file';
import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalFileContentsDirectoryProvider } from '../domain/LocalFileContentsDirectoryProvider';
import { LocalFileWriter } from '../domain/LocalFileWriter';
import path from 'path';

export class FSLocalFileWriter implements LocalFileWriter {
  constructor(
    private readonly locationProvider: LocalFileContentsDirectoryProvider
  ) {}

  async write(contents: LocalFileContents): Promise<string> {
    const location = await this.locationProvider.provide();

    const folderPath = path.join(location, 'internxt');
    ensureFolderExists(folderPath);

    const filePath = path.join(folderPath, contents.nameWithExtension);

    await WriteReadableToFile.write(contents.stream, filePath);

    return filePath;
  }
}
