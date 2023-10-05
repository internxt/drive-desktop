import { BoundaryBridgeContainer } from './BoundaryBridgeContainer';
import { FileCreationOrchestrator } from 'workers/sync-engine/modules/boundaryBridge/application/FileCreationOrchestrator';
import { ContentsContainer } from '../contents/ContentsContainer';
import { FilesContainer } from '../files/FilesContainer';

export function buildBoundaryBridgeContainer(
  contentsContainer: ContentsContainer,
  filesContainer: FilesContainer
): BoundaryBridgeContainer {
  const fileCreationOrchestrator = new FileCreationOrchestrator(
    contentsContainer.contentsUploader,
    filesContainer.fileCreator
  );

  return { fileCreationOrchestrator };
}
