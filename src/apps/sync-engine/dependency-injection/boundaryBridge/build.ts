import { BoundaryBridgeContainer } from './BoundaryBridgeContainer';
import { ContentsContainer } from '../contents/ContentsContainer';
import { FilesContainer } from '../files/FilesContainer';
import { FileCreationOrchestrator } from '../../../../context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { FileSyncOrchestrator } from '../../../../context/virtual-drive/boundaryBridge/application/FileSyncOrchestrator';
import { FileDangledManager } from '../../../../context/virtual-drive/boundaryBridge/application/FileDangledManager';

export function buildBoundaryBridgeContainer(
  contentsContainer: ContentsContainer,
  filesContainer: FilesContainer,
): BoundaryBridgeContainer {
  const fileCreationOrchestrator = new FileCreationOrchestrator(
    contentsContainer.contentsUploader,
    filesContainer.fileCreator,
    filesContainer.sameFileWasMoved,
  );

  const fileSyncOrchestrator = new FileSyncOrchestrator(filesContainer.fileSyncronizer);

  const fileDangledManager = new FileDangledManager(
    contentsContainer.contentsUploader,
    contentsContainer.contentsManagerFactory,
    filesContainer.fileOverwriteContent,
  );

  return {
    fileCreationOrchestrator,
    fileSyncOrchestrator,
    fileDangledManager,
  };
}
