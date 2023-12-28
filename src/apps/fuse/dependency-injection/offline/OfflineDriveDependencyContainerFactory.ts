import { buildBoundaryBridgeContainer } from './BoundaryBridge/boundaryBridgeContainerBuilder';
import { buildOfflineContentsContainer } from './OfflineContents/offlineContentsContainerBuilder';
import { OfflineDriveDependencyContainer } from './OfflineDriveDependencyContainer';
import { buildOfflineFilesContainer } from './OfflineFiles/builder';

export class OfflineDriveDependencyContainerFactory {
  private static _container: OfflineDriveDependencyContainer | undefined;

  static readonly subscribers: Array<keyof OfflineDriveDependencyContainer> =
    [];

  eventSubscribers(
    key: keyof OfflineDriveDependencyContainer
  ):
    | OfflineDriveDependencyContainer[keyof OfflineDriveDependencyContainer]
    | undefined {
    if (!OfflineDriveDependencyContainerFactory._container) return undefined;

    return OfflineDriveDependencyContainerFactory._container[key];
  }

  async build(): Promise<OfflineDriveDependencyContainer> {
    if (OfflineDriveDependencyContainerFactory._container !== undefined) {
      return OfflineDriveDependencyContainerFactory._container;
    }

    const filesContainer = await buildOfflineFilesContainer();
    const contentsContainer = await buildOfflineContentsContainer(
      filesContainer
    );

    const boundaryBridgeContainer = await buildBoundaryBridgeContainer(
      filesContainer,
      contentsContainer
    );

    const container = {
      ...filesContainer,
      ...contentsContainer,
      ...boundaryBridgeContainer,
    };

    return container;
  }
}
