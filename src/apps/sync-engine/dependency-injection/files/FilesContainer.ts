import { FileCreator } from '../../../../context/virtual-drive/files/application/FileCreator';
import { FileDeleter } from '../../../../context/virtual-drive/files/application/FileDeleter';
import { FilePathUpdater } from '../../../../context/virtual-drive/files/application/FilePathUpdater';
import { SameFileWasMoved } from '../../../../context/virtual-drive/files/application/SameFileWasMoved';
import { FileFolderContainerDetector } from '../../../../context/virtual-drive/files/application/FileFolderContainerDetector';
import { FileSyncronizer } from '../../../../context/virtual-drive/files/application/FileSyncronizer';
import { FileSyncStatusUpdater } from '../../../../context/virtual-drive/files/application/FileSyncStatusUpdater';
import { FileCheckerStatusInRoot } from '../../../../context/virtual-drive/files/application/FileCheckerStatusInRoot';
import { FilesPlaceholderDeleter } from '../../../../context/virtual-drive/files/application/FilesPlaceholderDeleter';
import { FileIdentityUpdater } from '../../../../context/virtual-drive/files/application/FileIndetityUpdater';
import { FileOverwriteContent } from '../../../../context/virtual-drive/files/application/FileOverwriteContent';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { FilesPlaceholderUpdater } from '@/context/virtual-drive/files/application/update/FilesPlaceholderUpdater';

export interface FilesContainer {
  fileRepository: InMemoryFileRepository;
  fileDeleter: FileDeleter;
  fileFolderContainerDetector: FileFolderContainerDetector;
  filePathUpdater: FilePathUpdater;
  fileCreator: FileCreator;
  fileSyncronizer: FileSyncronizer;
  sameFileWasMoved: SameFileWasMoved;
  filesPlaceholderUpdater: FilesPlaceholderUpdater;
  filesPlaceholderDeleter: FilesPlaceholderDeleter;
  fileSyncStatusUpdater: FileSyncStatusUpdater;
  filesCheckerStatusInRoot: FileCheckerStatusInRoot;
  fileIdentityUpdater: FileIdentityUpdater;
  fileOverwriteContent: FileOverwriteContent;
}
