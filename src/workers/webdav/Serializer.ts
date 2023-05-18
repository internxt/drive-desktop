import {
  FileSystemSerializer,
  ReturnCallback,
  FileSystem,
} from 'webdav-server/lib/index.v2';
import { FileUploader } from './application/FileUploader';
import { InxtPhysicalFileSystem } from './InxtPhysicalFileSystem';
import { Repository } from './Repository';

export class PhysicalSerializer implements FileSystemSerializer {
  constructor(
    private readonly uploader: FileUploader,
    private readonly repository: Repository
  ) {}

  uid(): string {
    return 'PhysicalFSSerializer-1.0.0';
  }

  serialize(fss: InxtPhysicalFileSystem, callback: ReturnCallback<any>): void {
    callback(undefined, {
      resources: fss.resources,
      rootPath: fss.rootPath,
    });
  }

  unserialize(serializedData: any, callback: ReturnCallback<FileSystem>): void {
    // tslint:disable-next-line:no-use-before-declare
    const fss = new InxtPhysicalFileSystem(
      serializedData.rootPath,
      this.uploader,
      this.repository
    );
    fss.resources = serializedData.resources;
    callback(undefined, fss);
  }
}
