import { ensureFolderExists } from '../../../../apps/shared/fs/ensure-folder-exists';
import { WriteReadableToFile } from '../../../../apps/shared/fs/write-readable-to-file';
import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalFileContentsDirectoryProvider } from '../../shared/domain/LocalFileContentsDirectoryProvider';
import { LocalFileWriter } from '../domain/LocalFileWriter';
import path from 'path';

export class FSLocalFileWriter implements LocalFileWriter {
  constructor(
    private readonly locationProvider: LocalFileContentsDirectoryProvider,
    private readonly subfolder: string
  ) {}

  async write(contents: LocalFileContents): Promise<string> {
    const location = await this.locationProvider.provide();

    const folderPath = path.join(location, this.subfolder);
    ensureFolderExists(folderPath);

    const filePath = path.join(folderPath, contents.nameWithExtension);

    await WriteReadableToFile.write(contents.stream, filePath);

    return filePath;
  }
}
