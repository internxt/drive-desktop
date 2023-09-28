import { getUser } from 'main/auth/service';
import { DomainEventSubscribers } from '../modules/shared/infrastructure/DomainEventSubscribers';
import { DependencyContainer } from './DependencyContainer';
import { DependencyInjectionEventBus } from './common/eventBus';
import { buildContentsContainer } from './contents/builder';
import { buildFilesContainer } from './files/builder';
import { buildFoldersContainer } from './folders/builder';
import { buildItemsContainer } from './items/builder';
import { DependencyInjectionVirtualDrive } from './common/virtualDrive';
import { buildPlaceholdersContainer } from './placeholders/builder';
import { buildBoundaryBridgeContainer } from './boundaryBridge/build';

export class DependencyContainerFactory {
  private static _container: DependencyContainer | undefined;

  static readonly subscribers: Array<keyof DependencyContainer> = [
    'createFilePlaceholderOnDeletionFailed',
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

    const itemsContainer = buildItemsContainer();
    const placeholderContainer = buildPlaceholdersContainer(itemsContainer);
    const contentsContainer = await buildContentsContainer();
    const foldersContainer = await buildFoldersContainer(placeholderContainer);
    const { container: filesContainer } = await buildFilesContainer(
      foldersContainer,
      placeholderContainer
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
      ...placeholderContainer,
      ...boundaryBridgeContainer,

      virtualDrive,
    };

    bus.addSubscribers(DomainEventSubscribers.from(container));
    DependencyContainerFactory._container = container;

    return container;
  }
}
