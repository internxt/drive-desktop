import { getUser } from 'main/auth/service';
import { getClients } from '../../../shared/HttpClient/backgroud-process-clients';
import { DependencyContainer } from './DependencyContainer';
import { buildContentsContainer } from './contents/builder';
import { buildItemsContainer } from './items/builder';
import { buildFilesContainer } from './files/builder';
import { buildFoldersContainer } from './folders/builder';

export class DependencyContainerFactory {
  private static _container: DependencyContainer | undefined;

  static readonly subscriptors: Array<keyof DependencyContainer> = [];

  eventSubscriptors(
    key: keyof DependencyContainer
  ): DependencyContainer[keyof DependencyContainer] | undefined {
    if (!DependencyContainerFactory._container) return undefined;

    return DependencyContainerFactory._container[key];
  }

  public get containter() {
    return DependencyContainerFactory._container;
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

    const itemsContainer = buildItemsContainer();
    const contentsContainer = await buildContentsContainer();
    const foldersContainer = await buildFoldersContainer();
    const filesContainer = await buildFilesContainer(foldersContainer);

    const container = {
      drive: clients.drive,
      newDrive: clients.newDrive,

      ...itemsContainer,
      ...contentsContainer,
      ...filesContainer,
      ...foldersContainer,
    };

    DependencyContainerFactory._container = container;

    return container;
  }
}
