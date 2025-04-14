import { DependencyContainer } from './DependencyContainer';
import { buildBoundaryBridgeContainer } from './boundaryBridge/build';
import { DependencyInjectionEventBus } from './common/eventBus';
import { DependencyInjectionVirtualDrive } from './common/virtualDrive';
import { buildContentsContainer } from './contents/builder';
import { buildFilesContainer } from './files/builder';
import { buildFoldersContainer } from './folders/builder';
import { buildItemsContainer } from './items/builder';
import { buildSharedContainer } from './shared/builder';

export class DependencyContainerFactory {
  private static _container: DependencyContainer | undefined;

  async build(): Promise<DependencyContainer> {
    if (DependencyContainerFactory._container !== undefined) {
      return DependencyContainerFactory._container;
    }

    const { bus } = DependencyInjectionEventBus;
    const { virtualDrive } = DependencyInjectionVirtualDrive;

    const sharedContainer = buildSharedContainer();
    const itemsContainer = buildItemsContainer();
    const contentsContainer = await buildContentsContainer(sharedContainer);
    const foldersContainer = await buildFoldersContainer(sharedContainer);
    const { container: filesContainer } = await buildFilesContainer(foldersContainer, sharedContainer, contentsContainer);
    const boundaryBridgeContainer = buildBoundaryBridgeContainer(contentsContainer, filesContainer);

    const container = {
      ...itemsContainer,
      ...contentsContainer,
      ...filesContainer,
      ...foldersContainer,
      ...sharedContainer,
      ...boundaryBridgeContainer,

      virtualDrive,
    };

    bus.addSubscribers([container.synchronizeOfflineModificationsOnFolderCreated]);

    DependencyContainerFactory._container = container;

    return container;
  }
}
