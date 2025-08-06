import { ensureFolderExists } from '../../../../apps/shared/fs/ensure-folder-exists';
import { WriteReadableToFile } from '../../../../apps/shared/fs/write-readable-to-file';
import { temporalFolderProvider } from '../application/temporalFolderProvider';
import { LocalFileContents } from '../domain/LocalFileContents';
import path from 'path';

export class FSLocalFileWriter {
  async write(contents: LocalFileContents): Promise<string> {
    const location = await temporalFolderProvider();

    ensureFolderExists(location);

    const filePath = path.join(location, contents.nameWithExtension);

    await WriteReadableToFile.write(contents.stream, filePath, contents.size.value);

    return filePath;
  }
}
