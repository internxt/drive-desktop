import { BoundaryBridgeContainer } from './BoundaryBridgeContainer';
import { FileCreationOrchestrator } from 'workers/sync-engine/modules/boundaryBridge/application/FileCreationOrchestrator';
import { ContentsContainer } from '../contents/ContentsContainer';
import { FilesContainer } from '../files/FilesContainer';
import { PlaceholderContainer } from '../placeholders/PlaceholdersContainer';
import { TreePlaceholderCreator } from '../../modules/boundaryBridge/application/TreePlaceholderCreator';
import { ItemsContainer } from '../items/ItemsContainer';
import { FoldersContainer } from '../folders/FoldersContainer';

export function buildBoundaryBridgeContainer(
  contentsContainer: ContentsContainer,
  filesContainer: FilesContainer,
  foldersContainer: FoldersContainer,
  itemsContainer: ItemsContainer,
  placeholderContainer: PlaceholderContainer,
): BoundaryBridgeContainer {
  const fileCreationOrchestrator = new FileCreationOrchestrator(
    contentsContainer.contentsUploader,
    filesContainer.filePathFromAbsolutePathCreator,
    filesContainer.fileCreator
  );

  const treePlaceholderCreator = new TreePlaceholderCreator(
    itemsContainer.treeBuilder,
    placeholderContainer.placeholderCreator,
    filesContainer.fileClearer,
    foldersContainer.folderClearer
  );

  return { fileCreationOrchestrator, treePlaceholderCreator };
}
