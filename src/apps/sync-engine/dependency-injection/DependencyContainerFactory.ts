import { DependencyContainer } from './DependencyContainer';
import { DependencyInjectionEventBus } from './common/eventBus';
import { buildContentsContainer } from './contents/builder';
import { buildFilesContainer } from './files/builder';
import { buildFoldersContainer } from './folders/builder';
import { buildItemsContainer } from './items/builder';
import { DependencyInjectionVirtualDrive } from './common/virtualDrive';
import { buildBoundaryBridgeContainer } from './boundaryBridge/build';
import { buildSharedContainer } from './shared/builder';
import { getUser } from 'apps/main/auth/service';
import { DomainEventSubscribers } from 'context/virtual-drive/shared/infrastructure/DomainEventSubscribers';

export class DependencyContainerFactory {
  private static _container: DependencyContainer | undefined;

  static readonly subscribers: Array<keyof DependencyContainer> = [
    'createFilePlaceholderOnDeletionFailed',
    'synchronizeOfflineModificationsOnFolderCreated',
  ];

  eventSubscribers(
    key: keyof DependencyContainer
  ): DependencyContainer[keyof DependencyContainer] | undefined {
    if (!DependencyContainerFactory._container) return undefined;

    return DependencyContainerFactory._container[key];
  }

  async build(): Promise<DependencyContainer> {
    if (DependencyContainerFactory._container !== undefined) {
      return DependencyContainerFactory._container;
    }
    const user = getUser();

    if (!user) {
      throw new Error('');
    }

    const { bus } = DependencyInjectionEventBus;
    const { virtualDrive } = DependencyInjectionVirtualDrive;

    const sharedContainer = buildSharedContainer();
    const itemsContainer = buildItemsContainer();
    const contentsContainer = await buildContentsContainer(sharedContainer);
    const foldersContainer = await buildFoldersContainer(sharedContainer);
    const { container: filesContainer } = await buildFilesContainer(
      foldersContainer,
      sharedContainer
    );
    const boundaryBridgeContainer = buildBoundaryBridgeContainer(
      contentsContainer,
      filesContainer
    );

    const container = {
      ...itemsContainer,
      ...contentsContainer,
      ...filesContainer,
      ...foldersContainer,
      ...sharedContainer,
      ...boundaryBridgeContainer,

      virtualDrive,
    };

    bus.addSubscribers(DomainEventSubscribers.from(container));
    DependencyContainerFactory._container = container;

    return container;
  }
}
