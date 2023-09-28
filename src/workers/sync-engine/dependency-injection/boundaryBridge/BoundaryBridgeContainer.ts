import { FileCreationOrchestrator } from '../../modules/boundaryBridge/application/FileCreationOrchestrator';

export interface BoundaryBridgeContainer {
  fileCreationOrchestrator: FileCreationOrchestrator;
}
