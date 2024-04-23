import { ContainerBuilder } from 'diod';
import { registerLocalFilesServices } from './registerLocalFilesServices';
import { registerTemporalFilesServices } from './registerTemporalFilesServices';

export class OfflineDependencyContainerFactory {
  static async build(builder: ContainerBuilder): Promise<void> {
    await registerTemporalFilesServices(builder);
    await registerLocalFilesServices(builder);
  }
}
