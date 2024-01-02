import { OfflineFileAndContentsCreator } from '../../../../../context/offline-drive/boundaryBridge/application/OfflineFileAndContentsCreator';
import { OfflineFilePathRetriever } from '../../../../../context/offline-drive/boundaryBridge/application/OfflineFilePathRetriever';
import { OfflineFileUploader } from '../../../../../context/offline-drive/boundaryBridge/application/OfflineFileUploader';
import { DependencyInjectionEventBus } from '../../common/eventBus';
import { OfflineContentsDependencyContainer } from '../OfflineContents/OfflineDriveDependencyContainer';
import { OfflineFilesContainer } from '../OfflineFiles/OfflineFilesContainer';
import { BoundaryBridgeContainer } from './BoundaryBridgeContainer';

export async function buildBoundaryBridgeContainer(
  offlineFileContainer: OfflineFilesContainer,
  offlineContentsContainer: OfflineContentsDependencyContainer
): Promise<BoundaryBridgeContainer> {
  const { bus } = DependencyInjectionEventBus;

  const offlineFilePathRetriever = new OfflineFilePathRetriever(
    offlineContentsContainer.offlineContentsPathCalculator
  );

  const offlineFileUploader = new OfflineFileUploader(
    offlineFilePathRetriever,
    offlineContentsContainer.offlineContentsUploader,
    bus
  );

  const offlineFileAndContentsCreator = new OfflineFileAndContentsCreator(
    offlineFileContainer.offlineFileCreator,
    offlineContentsContainer.offlineContentsCreator
  );

  return {
    offlineFileUploader,
    offlineFileAndContentsCreator,
  };
}
