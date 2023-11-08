import { BoundaryBridgeContainer } from './BoundaryBridgeContainer';
import { FileCreationOrchestrator } from 'workers/sync-engine/modules/boundaryBridge/application/FileCreationOrchestrator';
import { ContentsContainer } from '../contents/ContentsContainer';
import { FilesContainer } from '../files/FilesContainer';
import { PlaceholderContainer } from '../placeholders/PlaceholdersContainer';
import { TreePlaceholderCreator } from '../../modules/boundaryBridge/application/TreePlaceholderCreator';
import { ItemsContainer } from '../items/ItemsContainer';
import { FoldersContainer } from '../folders/FoldersContainer';
import { SharedContainer } from '../shared/SharedContainer';
import { SyncPlaceholders } from 'workers/sync-engine/modules/boundaryBridge/application/SyncPlaceholders';
import { UpdatePlaceholderFolder } from 'workers/sync-engine/modules/boundaryBridge/application/UpdatePlaceholderFolder';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';

export function buildBoundaryBridgeContainer(
  contentsContainer: ContentsContainer,
  filesContainer: FilesContainer,
  foldersContainer: FoldersContainer,
  itemsContainer: ItemsContainer,
  placeholderContainer: PlaceholderContainer,
  sharedContainer: SharedContainer
): BoundaryBridgeContainer {
  const virtualDrive = DependencyInjectionVirtualDrive.virtualDrive;

  const fileCreationOrchestrator = new FileCreationOrchestrator(
    contentsContainer.contentsUploader,
    filesContainer.fileCreator,
    filesContainer.sameFileWasMoved
  );

  const treePlaceholderCreator = new TreePlaceholderCreator(
    itemsContainer.existingItemsTreeBuilder,
    placeholderContainer.placeholderCreator
  );

  const syncRemoteFolder = new UpdatePlaceholderFolder(
    foldersContainer.folderByPartialSearcher,
    foldersContainer.managedFolderRepository,
    placeholderContainer.placeholderCreator,
    sharedContainer.relativePathToAbsoluteConverter
  );

  const syncPlaceholders = new SyncPlaceholders(
    itemsContainer.allStatusesTreeBuilder,
    syncRemoteFolder,
    virtualDrive
  );

  return {
    fileCreationOrchestrator,
    treePlaceholderCreator,
    syncPlaceholders: syncPlaceholders,
  };
}
