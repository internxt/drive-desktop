import { BoundaryBridgeContainer } from './BoundaryBridgeContainer';
import { ContentsContainer } from '../contents/ContentsContainer';
import { FilesContainer } from '../files/FilesContainer';
import { FileCreationOrchestrator } from '../../../../../context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';

export function buildBoundaryBridgeContainer(
  contentsContainer: ContentsContainer,
  filesContainer: FilesContainer
): BoundaryBridgeContainer {
  const fileCreationOrchestrator = new FileCreationOrchestrator(
    contentsContainer.retryContentsUploader,
    filesContainer.fileCreator,
    filesContainer.sameFileWasMoved
  );

  return {
    fileCreationOrchestrator,
  };
}
