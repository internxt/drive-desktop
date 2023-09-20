import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalFileWriter } from '../domain/LocalFileWriter';
import path from 'path';
import { ensureFolderExists } from '../../../../../shared/fs/ensure-folder-exists';
import { WriteReadableToFile } from '../../../../../shared/fs/write-readable-to-file';

export type LocationProvider = () => Promise<string>;

export class FSLocalFileWriter implements LocalFileWriter {
  constructor(private readonly getLocation: LocationProvider) {}

  async write(contents: LocalFileContents): Promise<string> {
    const location = await this.getLocation();

    const folderPath = path.join(location, 'internxt');
    ensureFolderExists(folderPath);

    const filePath = path.join(folderPath, contents.nameWithExtension);

    await WriteReadableToFile.write(contents.stream, filePath);

    return filePath;
  }
}
