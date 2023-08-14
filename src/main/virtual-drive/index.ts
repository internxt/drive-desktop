import Logger from 'electron-log';
import { debounce } from 'lodash';
import { Traverser } from '../../workers/webdav/modules/items/application/Traverser';
import eventBus from '../event-bus';
import {
  driveFilesCollection,
  driveFoldersCollection,
  remoteSyncManager,
} from '../remote-sync/handlers';

import crypt from '../../workers/utils/crypt';

import path from 'path';
import {
  ServerFile,
  ServerFileStatus,
} from '../../workers/filesystems/domain/ServerFile';
import {
  ServerFolder,
  ServerFolderStatus,
} from '../../workers/filesystems/domain/ServerFolder';
import { getVirtualDrivePath } from '../../workers/webdav/VirtualDrive';
import configStore from '../config';
import { DriveFile } from '../database/entities/DriveFile';
import { DriveFolder } from '../database/entities/DriveFolder';

const user = configStore.get('userData');
const traverser = new Traverser(crypt, user.root_folder_id);

function createPlaceHolderFile(info: {
  nameWithExtension: string;
  id: string;
  size: number;
  combinedAttributes: any;
  creationTime: string;
  lastWriteTime: string;
  lastAccesTime: string;
  absolutePath: string;
}) {
  // This function is just a placeholder for the lib one
  Logger.info('Placeholder going to be created: ', info);
}

function convertDriveToServer(updatedRemoteItems: {
  files: Array<DriveFile>;
  folders: Array<DriveFolder>;
}) {
  const files = updatedRemoteItems.files.map<ServerFile>((updatedFile) => {
    return {
      bucket: updatedFile.bucket,
      createdAt: updatedFile.createdAt,
      encrypt_version: '03-aes',
      fileId: updatedFile.fileId,
      folderId: updatedFile.folderId,
      id: updatedFile.id,
      modificationTime: updatedFile.modificationTime,
      name: updatedFile.name,
      size: updatedFile.size,
      type: updatedFile.type ?? null,
      updatedAt: updatedFile.updatedAt,
      userId: updatedFile.userId,
      status: updatedFile.status as ServerFileStatus,
    };
  });

  const folders = updatedRemoteItems.folders.map<ServerFolder>(
    (updatedFolder) => {
      return {
        bucket: updatedFolder.bucket ?? null,
        createdAt: updatedFolder.createdAt,
        id: updatedFolder.id,
        name: updatedFolder.name,
        parentId: updatedFolder.parentId ?? null,
        updatedAt: updatedFolder.updatedAt,
        plain_name: updatedFolder.plainName ?? null,
        status: updatedFolder.status as ServerFolderStatus,
      };
    }
  );

  return { files, folders };
}

async function createPlaceHolders(): Promise<void> {
  await remoteSyncManager.startRemoteSync();

  const [filesResult, foldersResult] = await Promise.all([
    driveFilesCollection.getAll(),
    driveFoldersCollection.getAll(),
  ]);

  if (!filesResult.success || !foldersResult.result) {
    throw new Error('error getting the files and folders');
  }

  const raw = convertDriveToServer({
    files: filesResult.result,
    folders: foldersResult.result,
  });

  const indexedItems = traverser.run(raw);

  const syncPath = getVirtualDrivePath();

  Object.entries(indexedItems).forEach(([relativePath, item]) => {
    if (item.isFolder()) {
      // TODO: Create folder placeholder
      return;
    }

    createPlaceHolderFile({
      nameWithExtension: item.nameWithExtension,
      id: item.fileId,
      size: item.size,
      combinedAttributes: null,
      creationTime: item.createdAt.toISOString(),
      lastWriteTime: item.updatedAt.toISOString(),
      lastAccesTime: item.updatedAt.toISOString(),
      // This shoulb be hte last access time but we don't store the last accessed time
      absolutePath: path.join(syncPath, relativePath),
    });
  });
}

eventBus.on('RECEIVED_REMOTE_CHANGES', async () => {
  debounce(createPlaceHolders, 500);
});

eventBus.on('USER_LOGGED_IN', () => {
  createPlaceHolders();
});
