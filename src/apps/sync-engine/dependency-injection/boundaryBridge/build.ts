import { BoundaryBridgeContainer } from './BoundaryBridgeContainer';
import { ContentsContainer } from '../contents/ContentsContainer';
import { FilesContainer } from '../files/FilesContainer';
import { FileCreationOrchestrator } from '../../../../context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { FileSyncOrchestrator } from '../../../../context/virtual-drive/boundaryBridge/application/FileSyncOrchestrator';

export function buildBoundaryBridgeContainer(
  contentsContainer: ContentsContainer,
  filesContainer: FilesContainer
): BoundaryBridgeContainer {
  const fileCreationOrchestrator = new FileCreationOrchestrator(
    contentsContainer.contentsUploader,
    filesContainer.fileCreator,
    filesContainer.sameFileWasMoved
  );

  const fileSyncOrchestrator = new FileSyncOrchestrator(
    contentsContainer.contentsUploader,
    contentsContainer.contentsDownloader,
    filesContainer.fileSyncronizer
  );

  return {
    fileCreationOrchestrator,
    fileSyncOrchestrator,
  };
}
