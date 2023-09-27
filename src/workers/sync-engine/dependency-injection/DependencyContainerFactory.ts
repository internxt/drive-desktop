import { getUser } from 'main/auth/service';
import { getClients } from '../../../shared/HttpClient/backgroud-process-clients';
import { DependencyContainer } from './DependencyContainer';
import { buildContentsContainer } from './contents/builder';
import { buildItemsContainer } from './items/builder';
import { buildFilesContainer } from './files/builder';
import { buildFoldersContainer } from './folders/builder';
import { VirtualDrive } from 'virtual-drive/dist';
import { DependencyInjectionEventBus } from './common/eventBus';
import { DomainEventSubscribers } from '../modules/shared/infrastructure/DomainEventSubscribers';

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

  async build(drive: VirtualDrive): Promise<DependencyContainer> {
    if (DependencyContainerFactory._container !== undefined) {
      return DependencyContainerFactory._container;
    }
    const user = getUser();

    if (!user) {
      throw new Error('');
    }

    const clients = getClients();

    const { bus } = DependencyInjectionEventBus;

    const itemsContainer = buildItemsContainer();
    const contentsContainer = await buildContentsContainer();
    const foldersContainer = await buildFoldersContainer();
    const { container: filesContainer } = await buildFilesContainer(
      foldersContainer,
      drive
    );

    const container = {
      drive: clients.drive,
      newDrive: clients.newDrive,

      ...itemsContainer,
      ...contentsContainer,
      ...filesContainer,
      ...foldersContainer,
    };

    bus.addSubscribers(DomainEventSubscribers.from(container));
    DependencyContainerFactory._container = container;

    return container;
  }
}
