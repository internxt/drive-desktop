import { Readable } from 'stream';
import { FileSize } from './FileSize';
import { RemoteFileContents } from './RemoteFileContent';
import { File } from './File';

export interface RemoteFileContentsRepository {
  clone(file: File): Promise<File['fileId']>;

  download(fileId: File): Promise<RemoteFileContents>;

  upload(size: FileSize, contents: Readable): Promise<File['fileId']>;
}
