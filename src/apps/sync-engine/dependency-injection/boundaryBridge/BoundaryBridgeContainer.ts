import { FileDangledManager } from '@/context/virtual-drive/boundaryBridge/application/FileDangledManager';
import { FileCreationOrchestrator } from '../../../../context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';

export interface BoundaryBridgeContainer {
  fileCreationOrchestrator: FileCreationOrchestrator;
  fileDangledManager: FileDangledManager;
}
