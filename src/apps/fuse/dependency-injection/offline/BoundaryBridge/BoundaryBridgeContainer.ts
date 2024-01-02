import { OfflineFileAndContentsCreator } from '../../../../../context/offline-drive/boundaryBridge/application/OfflineFileAndContentsCreator';
import { OfflineFileUploader } from '../../../../../context/offline-drive/boundaryBridge/application/OfflineFileUploader';

export interface BoundaryBridgeContainer {
  offlineFileUploader: OfflineFileUploader;
  offlineFileAndContentsCreator: OfflineFileAndContentsCreator;
}
