import { DependencyContainer } from './DependencyContainer';
import { buildBoundaryBridgeContainer } from './boundaryBridge/build';
import { virtualDrive } from './common/virtualDrive';
import { buildContentsContainer } from './contents/builder';
import { buildFilesContainer } from './files/builder';
import { buildSharedContainer } from './shared/builder';

export class DependencyContainerFactory {
  static build(): DependencyContainer {
    const sharedContainer = buildSharedContainer();
    const contentsContainer = buildContentsContainer();
    const { container: filesContainer } = buildFilesContainer(sharedContainer);
    const boundaryBridgeContainer = buildBoundaryBridgeContainer(contentsContainer, filesContainer);

    const container = {
      ...contentsContainer,
      ...filesContainer,
      ...sharedContainer,
      ...boundaryBridgeContainer,
      virtualDrive,
    };

    return container;
  }
}
