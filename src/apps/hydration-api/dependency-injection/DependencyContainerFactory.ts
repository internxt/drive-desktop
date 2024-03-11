import { DependencyContainer } from './DependencyContainer';
import { buildContentsContainer } from './contents/builder';
import { buildFilesContainer } from './files/builder';
import { buildFoldersContainer } from './folders/builder';
import { buildTreeContainer } from './tree/builder';

export class DependencyContainerFactory {
  private static _container: DependencyContainer | undefined;

  static readonly subscribers: Array<keyof DependencyContainer> = [];

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

    const treeContainer = buildTreeContainer();

    const contentsContainer = await buildContentsContainer();
    const foldersContainer = await buildFoldersContainer();
    const filesContainer = await buildFilesContainer(foldersContainer);

    const container = {
      ...treeContainer,
      ...contentsContainer,
      ...foldersContainer,
      ...filesContainer,
    };

    return container;
  }
}
