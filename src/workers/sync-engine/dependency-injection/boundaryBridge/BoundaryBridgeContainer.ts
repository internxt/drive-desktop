import { TreePlaceholderCreator } from '../../modules/boundaryBridge/application/TreePlaceholderCreator';
import { FileCreationOrchestrator } from '../../modules/boundaryBridge/application/FileCreationOrchestrator';

export interface BoundaryBridgeContainer {
  fileCreationOrchestrator: FileCreationOrchestrator;
  treePlaceholderCreator: TreePlaceholderCreator;
}
