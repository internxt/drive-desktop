import { TreePlaceholderCreator } from '../../modules/boundaryBridge/application/TreePlaceholderCreator';
import { FileCreationOrchestrator } from '../../modules/boundaryBridge/application/FileCreationOrchestrator';
import { SyncPlaceholders } from '../../modules/boundaryBridge/application/SyncPlaceholders';

export interface BoundaryBridgeContainer {
  fileCreationOrchestrator: FileCreationOrchestrator;
  treePlaceholderCreator: TreePlaceholderCreator;
  syncPlaceholders: SyncPlaceholders;
}
