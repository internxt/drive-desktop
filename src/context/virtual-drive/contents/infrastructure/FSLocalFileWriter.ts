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

  async write(contents: LocalFileContents, name?: string): Promise<string> {
    const location = await this.locationProvider.provide();

    const folderPath = path.join(location, this.subfolder);
    ensureFolderExists(folderPath);

    const fileName = name || contents.nameWithExtension;

    const filePath = path.join(folderPath, fileName);

    await WriteReadableToFile.write(contents.stream, filePath);

    return filePath;
  }
}
