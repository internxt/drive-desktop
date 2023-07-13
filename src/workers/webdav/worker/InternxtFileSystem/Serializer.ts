import {
  FileSystemSerializer,
  ReturnCallback,
  FileSystem,
} from '@internxt/webdav-server';
import Logger from 'electron-log';
import { InternxtFileSystem } from './InternxtFileSystem';

import { DependencyContainer } from '../../dependencyInjection/DependencyContainer';

export class DebugPhysicalSerializer implements FileSystemSerializer {
  constructor(private readonly dependencyContainer: DependencyContainer) {}

  uid(): string {
    return 'PhysicalFSSerializer-1.0.0';
  }

  serialize(fs: InternxtFileSystem, callback: ReturnCallback<any>): void {
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
    const fs = new InternxtFileSystem(this.dependencyContainer);
    fs.resources = serializedData.resources;
    callback(undefined, fs);
  }
}
