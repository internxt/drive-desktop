import { ContainerBuilder } from 'diod';
import { registerOfflineContentsServices } from './registerOfflineContentsServices';
import { registerOfflineFilesServices } from './registerOfflineFilesServices';
import { registerBoundaryBridgeContainer } from './registerBoundaryBridgeContainer';

export class OfflineDependencyContainerFactory {
  static async build(builder: ContainerBuilder): Promise<void> {
    await registerOfflineFilesServices(builder);

    await registerOfflineContentsServices(builder);

    await registerBoundaryBridgeContainer(builder);
  }
}
