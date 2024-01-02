import { SyncEngineDomainEventSubscribers } from './SyncEngineDomainEventSubscribers';
import { getUser } from '../../main/auth/service';
import { SyncEngineDependencyContainer } from './SyncEngineDependencyContainer';
import { buildBoundaryBridgeContainer } from './boundaryBridge/build';
import { DependencyInjectionEventBus } from './common/eventBus';
import { DependencyInjectionVirtualDrive } from './common/virtualDrive';
import { buildContentsContainer } from './contents/builder';
import { buildFilesContainer } from './files/builder';
import { buildFoldersContainer } from './folders/builder';
import { buildItemsContainer } from './items/builder';
import { buildSharedContainer } from './shared/builder';

export class SyncEngineDependencyContainerFactory {
  private static _container: SyncEngineDependencyContainer | undefined;

  static readonly subscribers: Array<keyof SyncEngineDependencyContainer> = [
    'createFilePlaceholderOnDeletionFailed',
    'synchronizeOfflineModificationsOnFolderCreated',
  ];

  eventSubscribers(
    key: keyof SyncEngineDependencyContainer
  ):
    | SyncEngineDependencyContainer[keyof SyncEngineDependencyContainer]
    | undefined {
    if (!SyncEngineDependencyContainerFactory._container) return undefined;

    return SyncEngineDependencyContainerFactory._container[key];
  }

  async build(): Promise<SyncEngineDependencyContainer> {
    if (SyncEngineDependencyContainerFactory._container !== undefined) {
      return SyncEngineDependencyContainerFactory._container;
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

    bus.addSubscribers(SyncEngineDomainEventSubscribers.from(container));
    SyncEngineDependencyContainerFactory._container = container;

    return container;
  }
}
