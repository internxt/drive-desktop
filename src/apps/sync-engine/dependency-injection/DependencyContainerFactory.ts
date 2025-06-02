import { DependencyContainer } from './DependencyContainer';
import { buildBoundaryBridgeContainer } from './boundaryBridge/build';
import { DependencyInjectionVirtualDrive } from './common/virtualDrive';
import { buildContentsContainer } from './contents/builder';
import { buildFilesContainer } from './files/builder';
import { buildFoldersContainer } from './folders/builder';
import { buildItemsContainer } from './items/builder';
import { buildSharedContainer } from './shared/builder';

export class DependencyContainerFactory {
  static build(): DependencyContainer {
    const { virtualDrive } = DependencyInjectionVirtualDrive;

    const sharedContainer = buildSharedContainer();
    const itemsContainer = buildItemsContainer();
    const contentsContainer = buildContentsContainer(sharedContainer);
    const foldersContainer = buildFoldersContainer(sharedContainer);
    const { container: filesContainer } = buildFilesContainer(foldersContainer, sharedContainer, contentsContainer);
    const boundaryBridgeContainer = buildBoundaryBridgeContainer(contentsContainer, filesContainer);

    const container = {
      ...itemsContainer,
      ...contentsContainer,
      ...filesContainer,
      ...foldersContainer,
      ...sharedContainer,
      ...boundaryBridgeContainer,

      virtualDrive,
    };

    return container;
  }
}
