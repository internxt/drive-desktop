import { v2 as webdav } from 'webdav-server';
import { ReturnCallback } from 'webdav-server/lib/index.v2';
import { InternxtFileSystem } from './InternxtFileSystem';

export class InternxtSerializer implements webdav.FileSystemSerializer {
  uid() {
    return 'InternxtFSSerializer-1.0.0';
  }

  serialize(fs: InternxtFileSystem, callback: ReturnCallback<any>) {
    callback(undefined, 'hola');
  }

  unserialize(
    serializedData: any,
    callback: ReturnCallback<InternxtFileSystem>
  ) {
    const fs = new InternxtFileSystem();

    callback(undefined, fs);
  }
}
