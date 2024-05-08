import { ContainerBuilder } from 'diod';
import { registerStorageFilesServices } from './registerStorageFilesServices';
import { registerStorageFoldersServices } from './registerStorageFolderServices';
import { registerTemporalFilesServices } from './registerTemporalFilesServices';
import { registerThumbnailsServices } from './registerThumbnailsServices';

export class OfflineDependencyContainerFactory {
  static async build(builder: ContainerBuilder): Promise<void> {
    await registerTemporalFilesServices(builder);
    await registerStorageFilesServices(builder);
    registerStorageFoldersServices(builder);
    await registerThumbnailsServices(builder);
  }
}
