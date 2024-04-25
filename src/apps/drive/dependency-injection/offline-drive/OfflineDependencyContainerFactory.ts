import { ContainerBuilder } from 'diod';
import { registerStorageFilesServices } from './registerStorageFilesServices';
import { registerTemporalFilesServices } from './registerTemporalFilesServices';

export class OfflineDependencyContainerFactory {
  static async build(builder: ContainerBuilder): Promise<void> {
    await registerTemporalFilesServices(builder);
    await registerStorageFilesServices(builder);
  }
}
