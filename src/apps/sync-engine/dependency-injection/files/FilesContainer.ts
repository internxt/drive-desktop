import { FileCreator } from '../../../../context/virtual-drive/files/application/FileCreator';
import { FileSyncStatusUpdater } from '../../../../context/virtual-drive/files/application/FileSyncStatusUpdater';
import { FileCheckerStatusInRoot } from '../../../../context/virtual-drive/files/application/FileCheckerStatusInRoot';
import { FileOverwriteContent } from '../../../../context/virtual-drive/files/application/FileOverwriteContent';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { FilesPlaceholderUpdater } from '@/context/virtual-drive/files/application/update/FilesPlaceholderUpdater';

export interface FilesContainer {
  fileRepository: InMemoryFileRepository;
  fileCreator: FileCreator;
  filesPlaceholderUpdater: FilesPlaceholderUpdater;
  fileSyncStatusUpdater: FileSyncStatusUpdater;
  filesCheckerStatusInRoot: FileCheckerStatusInRoot;
  fileOverwriteContent: FileOverwriteContent;
}
