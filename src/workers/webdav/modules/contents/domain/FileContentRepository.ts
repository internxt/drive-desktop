import { Readable } from 'stream';
import { FileSize } from '../../files/domain/FileSize';
import { RemoteFileContents } from './RemoteFileContent';
import { File } from '../../files/domain/File';

export interface RemoteFileContentsRepository {
  clone(file: File): Promise<File['fileId']>;

  download(fileId: File): Promise<RemoteFileContents>;

  upload(size: FileSize, contents: Readable): Promise<File['fileId']>;
}
