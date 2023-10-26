import { getUser } from 'main/auth/service';
import { DomainEventSubscribers } from '../modules/shared/infrastructure/DomainEventSubscribers';
import { DependencyContainer } from './DependencyContainer';
import { DependencyInjectionEventBus } from './common/eventBus';
import { buildContentsContainer } from './contents/builder';
import { buildFilesContainer } from './files/builder';
import { buildFoldersContainer } from './folders/builder';
import { buildItemsContainer } from './items/builder';
import { buildPlaceholdersContainer } from './placeholders/builder';
import { buildBoundaryBridgeContainer } from './boundaryBridge/build';
import { buildSharedContainer } from './shared/builder';

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

    const sharedContainer = buildSharedContainer();
    const itemsContainer = buildItemsContainer();
    const placeholderContainer = buildPlaceholdersContainer();
    const contentsContainer = await buildContentsContainer(sharedContainer);
    const foldersContainer = await buildFoldersContainer(placeholderContainer);
    const { container: filesContainer } = await buildFilesContainer(
      foldersContainer,
      placeholderContainer,
      sharedContainer
    );
    const boundaryBridgeContainer = buildBoundaryBridgeContainer(
      contentsContainer,
      filesContainer,
      foldersContainer,
      itemsContainer,
      placeholderContainer,
      sharedContainer
    );

    const container = {
      ...itemsContainer,
      ...contentsContainer,
      ...filesContainer,
      ...foldersContainer,
      ...placeholderContainer,
      ...sharedContainer,
      ...boundaryBridgeContainer,
    };

    bus.addSubscribers(DomainEventSubscribers.from(container));
    DependencyContainerFactory._container = container;

    return container;
  }
}
