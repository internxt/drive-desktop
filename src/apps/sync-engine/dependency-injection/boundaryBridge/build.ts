import { BoundaryBridgeContainer } from './BoundaryBridgeContainer';
import { ContentsContainer } from '../contents/ContentsContainer';
import { FilesContainer } from '../files/FilesContainer';
import { FileCreationOrchestrator } from '../../../../context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { FileDangledManager } from '../../../../context/virtual-drive/boundaryBridge/application/FileDangledManager';

export function buildBoundaryBridgeContainer(
  contentsContainer: ContentsContainer,
  filesContainer: FilesContainer,
): BoundaryBridgeContainer {
  const fileCreationOrchestrator = new FileCreationOrchestrator(filesContainer.fileCreator);

  const fileDangledManager = new FileDangledManager(contentsContainer.contentsManagerFactory, filesContainer.fileOverwriteContent);

  return {
    fileCreationOrchestrator,
    fileDangledManager,
  };
}
