import { Readable } from 'stream';
import { ensureFolderExists } from '../../../../apps/shared/fs/ensure-folder-exists';
import { WriteReadableToFile } from '../../../../apps/shared/fs/write-readable-to-file';
import { temporalFolderProvider } from '../application/temporalFolderProvider';
import path from 'path';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';

type Props = {
  file: SimpleDriveFile;
  readable: Readable;
};

export class FSLocalFileWriter {
  static async write({ file, readable }: Props): Promise<string> {
    const location = await temporalFolderProvider();

    ensureFolderExists(location);

    const filePath = path.join(location, file.nameWithExtension);

    await WriteReadableToFile.write(readable, filePath, file.size);

    return filePath;
  }
}
