import { storageManagerContainerFactory } from 'workers/webdav/dependencyInjection/StorageManagerContainerFactory';
import { InternxtStorageManager } from './InternxtStorageManager';

export class InternxtStorageManagerFactory {
  static async build(): Promise<InternxtStorageManager> {
    const container = await storageManagerContainerFactory.build();

    return new InternxtStorageManager(container);
  }
}
