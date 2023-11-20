import { DependencyContainer } from './DependencyContainer';
import { buildContentsContainer } from './contents/builder';
import { buildFilesContainer } from './files/builder';
import { buildFoldersContainer } from './folders/builder';
import { buildSharedContainer } from './shared/builder';
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

    const tree = await treeContainer.existingNodesTreeBuilder.run();

    const folderContainer = await buildFoldersContainer(tree.folders);
    const filesContainer = await buildFilesContainer(
      tree.files,
      folderContainer
    );
    const contentsContainer = await buildContentsContainer();
    const sharedContainer = await buildSharedContainer();

    const container = {
      ...treeContainer,
      ...folderContainer,
      ...filesContainer,
      ...contentsContainer,
      ...sharedContainer,
    };

    return container;
  }
}
