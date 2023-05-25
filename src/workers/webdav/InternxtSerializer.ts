import { v2 as webdav } from 'webdav-server';
import {
  ReturnCallback,
  VirtualFileSystem,
  FileSystem,
} from 'webdav-server/lib/index.v2';
import Logger from 'electron-log';
import { ProofOfConceptFileSystem } from './ProofOfConceptFileSystem';

export class InternxtSerializer implements webdav.FileSystemSerializer {
  uid() {
    return 'InternxtFSSerializer-1.0.0';
  }

  serialize(fs: ProofOfConceptFileSystem, callback: ReturnCallback<any>) {
    Logger.debug('[SLZ] SERIALIZE');
    callback(undefined, 'hola');
  }

  unserialize(serializedData: any, callback: ReturnCallback<FileSystem>) {
    Logger.debug('[SLZ] UNSERIALIZE');
    const fs = new VirtualFileSystem();

    callback(undefined, fs);
  }
}
