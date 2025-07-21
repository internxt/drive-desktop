import { Readable } from 'stream';
import { ContentsSize } from './ContentsSize';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';

export class LocalFileContents {
  private constructor(
    public readonly nameWithExtension: string,
    public readonly size: ContentsSize,
    public readonly stream: Readable,
  ) {}

  static downloadedFrom(file: SimpleDriveFile, contents: Readable) {
    const remoteContents = new LocalFileContents(file.nameWithExtension, new ContentsSize(file.size), contents);
    return remoteContents;
  }
}
