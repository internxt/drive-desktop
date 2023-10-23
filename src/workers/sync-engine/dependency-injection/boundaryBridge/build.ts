import { BoundaryBridgeContainer } from './BoundaryBridgeContainer';
import { FileCreationOrchestrator } from 'workers/sync-engine/modules/boundaryBridge/application/FileCreationOrchestrator';
import { ContentsContainer } from '../contents/ContentsContainer';
import { FilesContainer } from '../files/FilesContainer';
import { PlaceholderContainer } from '../placeholders/PlaceholdersContainer';
import { TreePlaceholderCreator } from '../../modules/boundaryBridge/application/TreePlaceholderCreator';
import { ItemsContainer } from '../items/ItemsContainer';
import { FoldersContainer } from '../folders/FoldersContainer';
import { UpdatePlaceholderFile } from 'workers/sync-engine/modules/boundaryBridge/application/UpdatePlaceholderFile';
import { SharedContainer } from '../shared/SharedContainer';
import { SyncPlaceholders } from 'workers/sync-engine/modules/boundaryBridge/application/SyncPlaceholders';
import { UpdatePlaceholderFolder } from 'workers/sync-engine/modules/boundaryBridge/application/UpdatePlaceholderFolder';
import { DependencyInjectionEventRepository } from '../common/eventRepository';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';

export function buildBoundaryBridgeContainer(
  contentsContainer: ContentsContainer,
  filesContainer: FilesContainer,
  foldersContainer: FoldersContainer,
  itemsContainer: ItemsContainer,
  placeholderContainer: PlaceholderContainer,
  sharedContainer: SharedContainer
): BoundaryBridgeContainer {
  const eventHistory = DependencyInjectionEventRepository.get();
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

  const syncRemoteFile = new UpdatePlaceholderFile(
    filesContainer.fileByPartialSearcher,
    filesContainer.managedFileRepository,
    placeholderContainer.placeholderCreator,
    sharedContainer.relativePathToAbsoluteConverter,
    sharedContainer.localFileIdProvider,
    eventHistory
  );

  const syncRemoteFolder = new UpdatePlaceholderFolder(
    foldersContainer.folderByPartialSearcher,
    foldersContainer.managedFolderRepository,
    placeholderContainer.placeholderCreator,
    sharedContainer.relativePathToAbsoluteConverter
  );

  const syncPlaceholders = new SyncPlaceholders(
    itemsContainer.allStatusesTreeBuilder,
    syncRemoteFile,
    syncRemoteFolder,
    virtualDrive
  );

  return {
    fileCreationOrchestrator,
    treePlaceholderCreator,
    syncPlaceholders: syncPlaceholders,
  };
}
