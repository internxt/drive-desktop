import { ProcessSyncContext } from '../config';
import { DependencyContainer } from './DependencyContainer';
import { buildBoundaryBridgeContainer } from './boundaryBridge/build';
import { buildContentsContainer } from './contents/builder';
import { buildFilesContainer } from './files/builder';
import { buildSharedContainer } from './shared/builder';

export class DependencyContainerFactory {
  static build({ ctx }: { ctx: ProcessSyncContext }): DependencyContainer {
    const sharedContainer = buildSharedContainer();
    const contentsContainer = buildContentsContainer({ ctx });
    const { container: filesContainer } = buildFilesContainer(ctx, sharedContainer);
    const boundaryBridgeContainer = buildBoundaryBridgeContainer(contentsContainer, filesContainer);

    const container = {
      ...contentsContainer,
      ...filesContainer,
      ...sharedContainer,
      ...boundaryBridgeContainer,
      virtualDrive: ctx.virtualDrive,
    };

    return container;
  }
}
