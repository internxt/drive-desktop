import { VirtualDriveDependencyContainer } from './VirtualDriveDependencyContainer';
import { buildContentsContainer } from './contents/builder';
import { buildFilesContainer } from './files/builder';
import { buildFoldersContainer } from './folders/builder';
import { buildSharedContainer } from './shared/builder';
import { buildTreeContainer } from './tree/builder';

export class VirtualDriveDependencyContainerFactory {
  private static _container: VirtualDriveDependencyContainer | undefined;

  static readonly subscribers: Array<keyof VirtualDriveDependencyContainer> = [
    'createFileOnOfflineFileUploaded',
    'moveOfflineContentsOnContentsUploaded',
  ];

  eventSubscribers(
    key: keyof VirtualDriveDependencyContainer
  ):
    | VirtualDriveDependencyContainer[keyof VirtualDriveDependencyContainer]
    | undefined {
    if (!VirtualDriveDependencyContainerFactory._container) return undefined;

    return VirtualDriveDependencyContainerFactory._container[key];
  }

  async build(): Promise<VirtualDriveDependencyContainer> {
    if (VirtualDriveDependencyContainerFactory._container !== undefined) {
      return VirtualDriveDependencyContainerFactory._container;
    }

    const treeContainer = buildTreeContainer();

    const tree = await treeContainer.existingNodesTreeBuilder.run();

    const sharedContainer = await buildSharedContainer();

    const folderContainer = await buildFoldersContainer(tree.folders);
    const contentsContainer = await buildContentsContainer(sharedContainer);
    const filesContainer = await buildFilesContainer(
      tree.files,
      folderContainer
    );

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
