import { aes } from '@internxt/lib';
import { dialog, IpcMainEvent } from 'electron';
import fetch from 'electron-fetch';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import os from 'os';
import path from 'path';
import fs, { PathLike } from 'fs';
import { getNewApiHeaders, getUser } from '../auth/service';
import configStore from '../config';
import { BackupInfo } from '../../backups/BackupInfo';
import { downloadFolderAsZip } from '../network/download';
import { FolderTree } from '@internxt/sdk/dist/drive/storage/types';
import { broadcastToWindows } from '../windows';
import { ipcMain } from 'electron';
import { PathTypeChecker } from '../../shared/fs/PathTypeChecker ';
import { driveServerModule } from '../../../infra/drive-server/drive-server.module';
import { DeviceModule } from '../../../backend/features/device/device.module';
import { fetchFolder } from '../../../infra/drive-server/services/backup/services/fetch-folder';
import { deleteFolder } from '../../../infra/drive-server/services/backup/services/delete-folder';
import { getBackupFolderUuid } from '../../../infra/drive-server/services/backup/services/fetch-backup-folder-uuid';
import { updateBackupFolderName } from '../../../infra/drive-server/services/backup/services/update-backup-folder-metadata';
import { migrateBackupEntryIfNeeded } from './migrate-backup-entry-if-needed';
import { createBackup } from '../backups/create-backup';

export type Device = {
  id: number;
  uuid: string;
  name: string;
  bucket: string;
  removed: boolean;
  hasBackups: boolean;
};

export async function getDevices(): Promise<Array<Device>> {
  const response = await driveServerModule.backup.getDevices();
  if (response.isLeft()) {
    return [];
  } else {
    const devices = response.getRight();
    return devices.filter(({ removed, hasBackups }) => !removed && hasBackups).map((device) => device);
  }
}

export async function fetchFolderTree(folderUuid: string): Promise<{
  tree: FolderTree;
  folderDecryptedNames: Record<number, string>;
  fileDecryptedNames: Record<number, string>;
  size: number;
}> {
  const res = await fetch(`${process.env.NEW_DRIVE_URL}/folders/${folderUuid}/tree`, {
    method: 'GET',
    headers: getNewApiHeaders(),
  });

  if (res.ok) {
    const { tree } = (await res.json()) as unknown as { tree: FolderTree };

    let size = 0;
    const folderDecryptedNames: Record<number, string> = {};
    const fileDecryptedNames: Record<number, string> = {};

    // ! Decrypts folders and files names
    const pendingFolders = [tree];
    while (pendingFolders.length > 0) {
      const currentTree = pendingFolders[0];
      const { folders, files } = {
        folders: currentTree.children,
        files: currentTree.files,
      };

      folderDecryptedNames[currentTree.id] = currentTree.plainName;

      for (const file of files) {
        fileDecryptedNames[file.id] = aes.decrypt(file.name, `${process.env.NEW_CRYPTO_KEY}-${file.folderId}`);
        size += Number(file.size);
      }

      pendingFolders.shift();

      // * Adds current folder folders to pending
      pendingFolders.push(...folders);
    }

    return { tree, folderDecryptedNames, fileDecryptedNames, size };
  } else {
    throw new Error('Unsuccesful request to fetch folder tree');
  }
}

export async function downloadBackup(device: Device): Promise<void> {
  const chosenItem = await getPathFromDialog();
  if (!chosenItem || !chosenItem.path) {
    return;
  }

  const chosenPath = chosenItem.path;
  logger.debug({
    tag: 'BACKUPS',
    msg: '[BACKUPS] Downloading Device',
    deviceName: device.name,
    chosenPath,
  });

  const date = new Date();
  const now =
    String(date.getFullYear()) +
    String(date.getMonth() + 1) +
    String(date.getDay()) +
    String(date.getHours()) +
    String(date.getMinutes()) +
    String(date.getSeconds());
  const zipFilePath = chosenPath + 'Backup_' + now + '.zip';

  const abortController = new AbortController();

  const abortListener = (_: IpcMainEvent, abortDeviceUuid: string) => {
    if (abortDeviceUuid === device.uuid) {
      abortController.abort();
    }
  };

  const listenerName = 'abort-download-backups-' + device.uuid;

  const removeListenerIpc = ipcMain.on(listenerName, abortListener);

  try {
    await downloadDeviceBackupZip(device, zipFilePath, {
      updateProgress: (progress: number) => {
        if (abortController?.signal.aborted) return;
        broadcastToWindows('backup-download-progress', {
          id: device.uuid,
          progress,
        });
      },
      abortController,
    });
  } catch (_) {
    // Try to delete zip if download backup has failed
    try {
      fs.unlinkSync(zipFilePath);
    } catch (_) {
      /* noop */
    }
  }

  removeListenerIpc.removeListener(listenerName, abortListener);
}

async function downloadDeviceBackupZip(
  device: Device,
  path: PathLike,
  {
    updateProgress,
    abortController,
  }: {
    updateProgress: (progress: number) => void;
    abortController?: AbortController;
  },
): Promise<void> {
  if (!device.id) {
    throw new Error('This backup has not been uploaded yet');
  }

  const user = getUser();
  if (!user) {
    throw new Error('No saved user');
  }

  const folder = await fetchFolder(device.uuid);
  if (!folder || !folder.uuid || folder.uuid.length === 0) {
    throw new Error('No backup data found');
  }

  const networkApiUrl = process.env.BRIDGE_URL;
  const bridgeUser = user.bridgeUser;
  const bridgePass = user.userId;
  const encryptionKey = configStore.get('mnemonic');

  await downloadFolderAsZip(
    device.name,
    networkApiUrl!,
    folder.uuid,
    path,
    {
      bridgeUser,
      bridgePass,
      encryptionKey,
    },
    {
      abortController,
      updateProgress,
    },
  );
}

export async function deleteBackup(backup: BackupInfo, isCurrent?: boolean): Promise<void> {
  const res = await deleteFolder(backup.folderId);
  if (!res.ok) {
    throw new Error('Request to delete backup wasnt succesful');
  }

  if (isCurrent) {
    const backupsList = configStore.get('backupList');

    const entriesFiltered = Object.entries(backupsList).filter(([, b]) => b.folderId !== backup.folderId);

    const backupListFiltered = Object.fromEntries(entriesFiltered);

    configStore.set('backupList', backupListFiltered);
  }
}

export async function deleteBackupsFromDevice(device: Device, isCurrent?: boolean): Promise<void> {
  const backups = await DeviceModule.getBackupsFromDevice(device, isCurrent);
  logger.debug({ tag: 'BACKUPS', msg: '[BACKUPS] Deleting backups from device', count: backups.length });
  logger.debug({ tag: 'BACKUPS', msg: '[BACKUPS] Backups details', backups });

  let deletionPromises: Promise<any>[] = backups.map((backup) => deleteBackup(backup, isCurrent));
  await Promise.all(deletionPromises);

  // delete backups that are not in the backup list
  const { tree } = await fetchFolderTree(device.uuid);
  const foldersToDelete = tree.children.filter((folder) => !backups.some((backup) => backup.folderId === folder.id));
  deletionPromises = foldersToDelete.map((folder) => deleteFolder(folder.id));
  await Promise.all(deletionPromises);
}

export async function disableBackup(backup: BackupInfo): Promise<void> {
  const backupsList = configStore.get('backupList');
  const pathname = findBackupPathnameFromId(backup.folderId)!;

  try {
    backupsList[pathname].enabled = false;
    configStore.set('backupList', backupsList);

    const { size } = await fetchFolderTree(backup.folderUuid);

    if (size === 0) {
      await deleteBackup(backup, true);
    }
  } catch (error) {
    logger.error({ tag: 'BACKUPS', msg: 'Error disabling backup folder', error });
  }
}

export async function changeBackupPath(currentPath: string): Promise<boolean> {
  const backupsList = configStore.get('backupList');
  const existingBackup = backupsList[currentPath];

  if (!existingBackup) {
    throw new Error('Backup no longer exists');
  }

  const chosen = await getPathFromDialog();

  if (!chosen || !chosen.path) {
    return false;
  }

  const chosenPath = chosen.path;
  if (backupsList[chosenPath]) {
    throw new Error('A backup with this path already exists');
  }
  const oldFolderName = path.basename(currentPath);
  const newFolderName = path.basename(chosenPath);
  if (oldFolderName !== newFolderName) {
    logger.debug({ tag: 'BACKUPS', msg: 'Renaming backup', existingBackup });
    const getFolderUuidResponse = await getBackupFolderUuid(existingBackup);
    if (getFolderUuidResponse.error) {
      throw getFolderUuidResponse.error;
    }
    const { data: folderUuid } = getFolderUuidResponse;

    const res = await updateBackupFolderName(folderUuid, newFolderName);

    if (res.error) {
      throw new Error('Error in the request to rename a backup');
    }

    delete backupsList[currentPath];

    const migratedExistingBackup = await migrateBackupEntryIfNeeded(chosenPath, existingBackup);
    backupsList[chosenPath] = migratedExistingBackup;

    configStore.set('backupList', backupsList);

    return true;
  }
  return false;
}

export function findBackupPathnameFromId(id: number): string | undefined {
  const backupsList = configStore.get('backupList');
  const entryfound = Object.entries(backupsList).find(([, b]) => b.folderId === id);

  return entryfound?.[0];
}

export async function createBackupsFromLocalPaths(folderPaths: string[]) {
  configStore.set('backupsEnabled', true);

  const result = await DeviceModule.getOrCreateDevice();
  if (result instanceof Error) {
    throw result;
  }
  const operations = folderPaths.map((folderPath) => createBackup({ pathname: folderPath, device: result }));

  await Promise.all(operations);
}

export type PathInfo = {
  path: string;
  itemName: string;
  isDirectory?: boolean;
};

export async function getPathFromDialog(): Promise<{
  path: string;
  itemName: string;
} | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (result.canceled) {
    return null;
  }

  const chosenPath = result.filePaths[0];

  const itemPath = chosenPath + (chosenPath[chosenPath.length - 1] === path.sep ? '' : path.sep);

  const itemName = path.basename(itemPath);

  return {
    path: itemPath,
    itemName,
  };
}

export async function getMultiplePathsFromDialog(allowFiles = false): Promise<PathInfo[] | null> {
  const result = await dialog.showOpenDialog({
    properties: ['multiSelections' as const, ...(allowFiles ? (['openFile'] as const) : ['openDirectory' as const])],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const paths = await Promise.all(
    result.filePaths.map(async (filePath) => {
      const isFolder = await PathTypeChecker.isFolder(filePath);
      const itemName = path.basename(filePath);
      return {
        path: filePath,
        itemName,
        isDirectory: isFolder,
      };
    }),
  );

  return paths;
}

export async function getUserSystemPath(): Promise<PathInfo | undefined> {
  const filePath = os.homedir();
  if (!filePath) return;

  const isFolder = await PathTypeChecker.isFolder(filePath);
  const itemName = path.basename(filePath);

  return {
    path: filePath,
    itemName,
    isDirectory: isFolder,
  };
}
