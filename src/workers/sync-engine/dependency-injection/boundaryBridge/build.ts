import { BoundaryBridgeContainer } from './BoundaryBridgeContainer';
import { FileCreationOrchestrator } from 'workers/sync-engine/modules/boundaryBridge/application/FileCreationOrchestrator';
import { ContentsContainer } from '../contents/ContentsContainer';
import { FilesContainer } from '../files/FilesContainer';
import { PlaceholderContainer } from '../placeholders/PlaceholdersContainer';
import { TreePlaceholderCreator } from '../../modules/boundaryBridge/application/TreePlaceholderCreator';
import { ItemsContainer } from '../items/ItemsContainer';
import { FoldersContainer } from '../folders/FoldersContainer';
import { SyncRemoteFile } from 'workers/sync-engine/modules/boundaryBridge/application/SyncRemoteFile';
import { SharedContainer } from '../shared/SharedContainer';
import { SyncPlaceholders } from 'workers/sync-engine/modules/boundaryBridge/application/SyncPlaceholders';
import { SyncRemoteFolder } from 'workers/sync-engine/modules/boundaryBridge/application/SyncRemoteFolder';

export function buildBoundaryBridgeContainer(
  contentsContainer: ContentsContainer,
  filesContainer: FilesContainer,
  foldersContainer: FoldersContainer,
  itemsContainer: ItemsContainer,
  placeholderContainer: PlaceholderContainer,
  sharedContainer: SharedContainer
): BoundaryBridgeContainer {
  const fileCreationOrchestrator = new FileCreationOrchestrator(
    contentsContainer.contentsUploader,
    filesContainer.fileCreator
  );

  const treePlaceholderCreator = new TreePlaceholderCreator(
    itemsContainer.treeBuilder,
    placeholderContainer.placeholderCreator,
    filesContainer.fileClearer,
    foldersContainer.folderClearer
  );

  const syncRemoteFile = new SyncRemoteFile(
    filesContainer.fileByPartialSearcher,
    filesContainer.managedFileRepository,
    placeholderContainer.placeholderCreator,
    sharedContainer.relativePathToAbsoluteConverter
  );

  const syncRemoteFolder = new SyncRemoteFolder(
    foldersContainer.folderByPartialSearcher,
    foldersContainer.managedFolderRepository,
    placeholderContainer.placeholderCreator,
    sharedContainer.relativePathToAbsoluteConverter
  );

  const syncPlaceholders = new SyncPlaceholders(
    itemsContainer.treeBuilder,
    syncRemoteFile,
    syncRemoteFolder
  );

  return {
    fileCreationOrchestrator,
    treePlaceholderCreator,
    syncPlaceholders: syncPlaceholders,
  };
}
