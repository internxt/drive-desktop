import {
  FileSystemSerializer,
  ReturnCallback,
  FileSystem,
} from 'webdav-server/lib/index.v2';
import Logger from 'electron-log';
import { FileUploader } from './application/FileUploader';
import { InxtFileSystem } from './InxtFileSystem';
import { TreeRepository } from './Repository';

export class DebugPhysicalSerializer implements FileSystemSerializer {
  constructor(
    private readonly uploader: FileUploader,
    private readonly repository: TreeRepository
  ) {}

  uid(): string {
    return 'PhysicalFSSerializer-1.0.0';
  }

  serialize(fs: InxtFileSystem, callback: ReturnCallback<any>): void {
    Logger.debug('SERIALIZER SERIALIZE');

    callback(undefined, {
      fileSystem: fs,
    });
  }

  unserialize(serializedData: any, callback: ReturnCallback<FileSystem>): void {
    Logger.debug(
      'SERIALIZER UNSERIALIZE. DATA: ',
      JSON.stringify(serializedData)
    );
    const fs = new InxtFileSystem(this.uploader, this.repository);
    fs.resources = serializedData.resources;
    callback(undefined, fs);
  }
}
