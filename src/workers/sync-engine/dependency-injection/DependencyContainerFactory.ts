import { getUser } from 'main/auth/service';
import { getClients } from '../../../shared/HttpClient/backgroud-process-clients';
import { DomainEventSubscribers } from '../modules/shared/infrastructure/DomainEventSubscribers';
import { DependencyContainer } from './DependencyContainer';
import { DependencyInjectionEventBus } from './common/eventBus';
import { buildContentsContainer } from './contents/builder';
import { buildFilesContainer } from './files/builder';
import { buildFoldersContainer } from './folders/builder';
import { buildItemsContainer } from './items/builder';
import { DependencyInjectionVirtualDrive } from './common/virtualDrive';
import { buildPlaceholdersContainer } from './placeholders/builder';

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

    const clients = getClients();

    const { bus } = DependencyInjectionEventBus;
    const { virtualDrive } = DependencyInjectionVirtualDrive;

    const PlaceholderContainer = buildPlaceholdersContainer();
    const itemsContainer = buildItemsContainer();
    const contentsContainer = await buildContentsContainer();
    const foldersContainer = await buildFoldersContainer(PlaceholderContainer);
    const { container: filesContainer } = await buildFilesContainer(
      foldersContainer
    );

    const container = {
      drive: clients.drive,
      newDrive: clients.newDrive,

      ...itemsContainer,
      ...contentsContainer,
      ...filesContainer,
      ...foldersContainer,

      virtualDrive,
    };

    bus.addSubscribers(DomainEventSubscribers.from(container));
    DependencyContainerFactory._container = container;

    return container;
  }
}
