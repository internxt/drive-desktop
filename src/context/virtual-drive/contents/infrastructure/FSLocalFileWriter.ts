import { ensureFolderExists } from '../../../../apps/shared/fs/ensure-folder-exists';
import { WriteReadableToFile } from '../../../../apps/shared/fs/write-readable-to-file';
import { LocalFileContents } from '../domain/LocalFileContents';
import path from 'path';

type LocationProvider = () => Promise<string>;

export class FSLocalFileWriter {
  constructor(private readonly getLocation: LocationProvider) {}

  async write(contents: LocalFileContents): Promise<string> {
    const location = await this.getLocation();

    ensureFolderExists(location);

    const filePath = path.join(location, contents.nameWithExtension);

    await WriteReadableToFile.write(contents.stream, filePath, contents.size.value);

    return filePath;
  }
}
