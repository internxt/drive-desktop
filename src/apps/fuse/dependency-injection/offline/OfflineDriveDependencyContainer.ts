import { BoundaryBridgeContainer } from './BoundaryBridge/BoundaryBridgeContainer';
import { OfflineContentsDependencyContainer } from './OfflineContents/OfflineDriveDependencyContainer';
import { OfflineFilesContainer } from './OfflineFiles/OfflineFilesContainer';

export interface OfflineDriveDependencyContainer
  extends OfflineFilesContainer,
    OfflineContentsDependencyContainer,
    BoundaryBridgeContainer {}
