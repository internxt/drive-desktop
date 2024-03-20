import { OfflineFileAndContentsCreator } from '../../../../../context/offline-drive/boundaryBridge/application/OfflineFileAndContentsCreator';
import { OfflineFileUploader } from '../../../../../context/offline-drive/boundaryBridge/application/OfflineFileUploader';
import { OfflineContentsDependencyContainer } from '../OfflineContents/OfflineDriveDependencyContainer';
import { OfflineFilesContainer } from '../OfflineFiles/OfflineFilesContainer';
import { BoundaryBridgeContainer } from './BoundaryBridgeContainer';

export async function buildBoundaryBridgeContainer(
  offlineFileContainer: OfflineFilesContainer,
  offlineContentsContainer: OfflineContentsDependencyContainer
): Promise<BoundaryBridgeContainer> {
  const offlineFileAndContentsCreator = new OfflineFileAndContentsCreator(
    offlineFileContainer.offlineFileCreator,
    offlineContentsContainer.offlineContentsCreator
  );

  const offlineFileUploader = new OfflineFileUploader(
    offlineFileContainer.offlineFileSearcher,
    offlineContentsContainer.offlineContentsUploader
  );

  return {
    offlineFileAndContentsCreator,
    offlineFileUploader,
  };
}
