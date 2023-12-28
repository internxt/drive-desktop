import { OfflineFilePathRetriever } from '../../../../../context/offline-drive/boundaryBridge/application/OfflineFilePathRetriever';
import { OfflineFileUploader } from '../../../../../context/offline-drive/boundaryBridge/application/OfflineFileUploader';
import { OfflineContentsDependencyContainer } from '../OfflineContents/OfflineDriveDependencyContainer';
import { OfflineFilesContainer } from '../OfflineFiles/OfflineFilesContainer';
import { BoundaryBridgeContainer } from './BoundaryBridgeContainer';

export async function buildBoundaryBridgeContainer(
  offlineFileContainer: OfflineFilesContainer,
  offlineContentsContainer: OfflineContentsDependencyContainer
): Promise<BoundaryBridgeContainer> {
  const offlineFilePathRetriever = new OfflineFilePathRetriever(
    offlineFileContainer.offlineFileFinder,
    offlineContentsContainer.offlineContentsPathCalculator
  );

  const offlineFileUploader = new OfflineFileUploader(
    offlineFilePathRetriever,
    offlineContentsContainer.offlineContentsUploader
  );

  return {
    offlineFileUploader,
  };
}
