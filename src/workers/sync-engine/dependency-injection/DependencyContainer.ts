/* eslint-disable max-len */
import { VirtualDrive } from 'virtual-drive/dist';
import { FileCreator } from '../modules/files/application/FileCreator';
import { FilePathFromAbsolutePathCreator } from '../modules/files/application/FilePathFromAbsolutePathCreator';
import { FilePathUpdater } from '../modules/files/application/FilePathUpdater';
import { FileSearcher } from '../modules/files/application/FileSearcher';
import { FolderSearcher } from '../modules/folders/application/FolderSearcher';
import { ContentsContainer } from './contents/ContentsContainer';
import { FilesContainer } from './files/FilesContainer';
import { FoldersContainer } from './folders/FoldersContainer';
import { ItemsContainer } from './items/ItemsContainer';
import { PlaceholderContainer } from './placeholders/PlaceholdersContainer';

export interface DependencyContainer
  extends ItemsContainer,
    ContentsContainer,
    FilesContainer,
    FoldersContainer,
    PlaceholderContainer {
  fileCreator: FileCreator;
  filePathUpdater: FilePathUpdater;
  fileSearcher: FileSearcher;
  filePathFromAbsolutePathCreator: FilePathFromAbsolutePathCreator;

  folderSearcher: FolderSearcher;

  virtualDrive: VirtualDrive;
}
