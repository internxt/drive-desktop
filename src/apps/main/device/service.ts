import { aes } from '@internxt/lib';
import { app, BrowserWindow, dialog, IpcMainEvent } from 'electron';
import fetch from 'electron-fetch';
import logger from 'electron-log';
import os from 'os';
import path from 'path';
import fs, { PathLike } from 'fs';
import { getHeaders, getNewApiHeaders, getUser } from '../auth/service';
import configStore from '../config';
import { addAppIssue } from '../issues/app';
import { BackupInfo } from '../../backups/BackupInfo';
import { downloadFolderAsZip } from '../network/download';
import { FolderTree } from '@internxt/sdk/dist/drive/storage/types';
import { broadcastToWindows } from '../windows';
import { ipcMain } from 'electron';
import { DependencyInjectionUserProvider } from '../../shared/dependency-injection/DependencyInjectionUserProvider';
import { BackupError } from '../../backups/BackupError';
import { PathTypeChecker } from '../../shared/fs/PathTypeChecker ';
import { driveServerModule } from '../../../infra/drive-server/drive-server.module';
import Logger from 'electron-log';

export type Device = {
  id: number;
  uuid: string;
  name: string;
  bucket: string;
  removed: boolean;
  hasBackups: boolean;
};

export const addUnknownDeviceIssue = (error: Error) => {
  addAppIssue({
    errorName: 'UNKNOWN_DEVICE_NAME',
    action: 'GET_DEVICE_NAME_ERROR',
    errorDetails: {
      name: error.name,
      message: error.message,
      stack: error.stack || '',
    },
  });
};

function createDevice(deviceName: string) {
  return driveServerModule.backup.createDevice(deviceName);
}

export async function getDevices(): Promise<Array<Device>> {
  const response = await driveServerModule.backup.getDevices();
  if (response.isLeft()) {
    return [];
  } else {
    const devices = response.getRight();
    return devices
      .filter(({ removed, hasBackups }) => !removed && hasBackups)
      .map((device) => decryptDeviceName(device));
  }
}

async function tryToCreateDeviceWithDifferentNames(): Promise<Device> {
  let res = await createDevice(os.hostname());

  let i = 1;

  while (res.isLeft() && i <= 10) {
    const deviceName = `${os.hostname()} (${i})`;
    logger.info(`[DEVICE] Creating device with name "${deviceName}"`);
    res = await createDevice(deviceName);
    i++;
  }

  if (res.isLeft()) {
    const deviceName = `${new Date().valueOf() % 1000}`;
    logger.info(`[DEVICE] Creating device with name "${deviceName}"`);
    res = await createDevice(`${os.hostname()} (${deviceName})`);
  }

  if (res.isRight()) {
    return res.getRight();
  }
  const error = new Error('Could not create device trying different names');
  addUnknownDeviceIssue(error);
  throw error;
}

export async function getOrCreateDevice() {
  const legacyId = configStore.get('deviceId'); // This is the legacy way of story the deviceId, we are now using the uuid
  const savedUUID = configStore.get('deviceUUID');

  Logger.debug({
    msg: '[DEVICE] Saved device with legacy deviceId',
    savedDeviceId: legacyId,
  });
  Logger.debug({
    msg: '[DEVICE] Saved device with UUID',
    savedDeviceId: savedUUID,
  });

  const hasLegacyId = legacyId !== -1;
  const hasUuid = savedUUID !== '';

  const onlyLegacy = hasLegacyId && !hasUuid;
  const onlyUuid = !hasLegacyId && hasUuid;

  if (onlyLegacy) {
    /* eventually, this whole if section is going to be replaced
    when all the users naturaly migrated to the new uuid */
    const response = await driveServerModule.backup.getDeviceById(legacyId.toString());

    if (response.isRight()) {
      const device = response.getRight();
      if (!device.removed) {
        configStore.set('deviceUUID', device.uuid);
        configStore.set('deviceId', -1);

        return decryptDeviceName(device);
      }
    }
  }

  if (onlyUuid) {
    const response = await driveServerModule.backup.getDevice(savedUUID);

    if (response.isRight()) {
      const device = response.getRight();
      if (!device.removed) {
        return decryptDeviceName(device);
      }
    }
  }

  const newDevice = await tryToCreateDeviceWithDifferentNames();

  configStore.set('deviceUUID', newDevice.uuid);
  configStore.set('deviceId', -1);
  configStore.set('backupList', {});
  const device = decryptDeviceName(newDevice);
  const user = DependencyInjectionUserProvider.get();
  user.backupsBucket = newDevice.bucket;
  DependencyInjectionUserProvider.updateUser(user);

  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (mainWindow) {
    mainWindow.webContents.send('reinitialize-backups');
  }

  broadcastToWindows('device-created', device);

  logger.info(`[DEVICE] Created device with name "${device.name}"`);

  return device;
}

function getDeviceUUID(): string {
  const deviceUuid = configStore.get('deviceUUID');

  if (deviceUuid === '') {
    throw new Error('deviceUuid is not defined');
  }

  return deviceUuid;
}

export async function renameDevice(deviceName: string): Promise<Device> {
  const deviceUUID = getDeviceUUID();

  const response = await driveServerModule.backup.updateDevice(
    deviceUUID,
    deviceName
  );
  if (response.isRight()) {
    const device = response.getRight();
    return decryptDeviceName(device);
  } else {
    throw new Error('Error in the request to rename a device');
  }
}

function decryptDeviceName({ name, ...rest }: Device): Device {
  return {
    name: aes.decrypt(name, `${process.env.NEW_CRYPTO_KEY}-${rest.bucket}`),
    ...rest,
  };
}

export type Backup = { id: number; name: string; uuid: string };

export async function getBackupsFromDevice(
  device: Device,
  isCurrent?: boolean
): Promise<Array<BackupInfo>> {
  if (isCurrent) {
    const backupsList = configStore.get('backupList');
    const device = await getOrCreateDevice();
    const folder = await fetchFolder(device.id);

    return folder.children
      .filter((backup: Backup) => {
        const pathname = findBackupPathnameFromId(backup.id);
        return pathname && backupsList[pathname].enabled;
      })
      .map((backup: Backup) => ({
        ...backup,
        pathname: findBackupPathnameFromId(backup.id),
        folderId: backup.id,
        folderUuid: backup.uuid,
        tmpPath: app.getPath('temp'),
        backupsBucket: device.bucket,
      }));
  } else {
    const folder = await fetchFolder(device.id);
    return folder.children.map((backup: Backup) => ({
      ...backup,
      folderId: backup.id,
      folderUuid: backup.uuid,
      backupsBucket: device.bucket,
      tmpPath: '',
      pathname: '',
    }));
  }
}

/**
 * Posts a Backup to desktop server API
 *
 * @param name Name of the backup folder
 * @returns
 */
async function postBackup(name: string): Promise<Backup> {
  const deviceId = (await getOrCreateDevice()).id;

  const res = await fetch(`${process.env.API_URL}/storage/folder`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ parentFolderId: deviceId, folderName: name }),
  });

  if (res.ok) {
    return res.json();
  }
  if (res.status === 409) {
    throw new BackupError('FOLDER_ALREADY_EXISTS');
  }
  if (res.status >= 500) {
    throw new BackupError('BAD_RESPONSE');
  }
  throw new BackupError('UNKNOWN');
}

/**
 * Creates a backup given a local folder path
 * @param pathname Path to the local folder for the backup
 */
async function createBackup(pathname: string): Promise<void> {
  const { base } = path.parse(pathname);
  const newBackup = await postBackup(base);
  const backupList = configStore.get('backupList');

  backupList[pathname] = { enabled: true, folderId: newBackup.id };

  configStore.set('backupList', backupList);
}

export async function addBackup(): Promise<void> {
  const chosenItem = await getPathFromDialog();
  if (!chosenItem || !chosenItem.path) {
    return;
  }

  const chosenPath = chosenItem.path;
  const backupList = configStore.get('backupList');

  const existingBackup = backupList[chosenPath];

  if (!existingBackup) {
    return createBackup(chosenPath);
  }

  let folderStillExists;
  try {
    await fetchFolder(existingBackup.folderId);
    folderStillExists = true;
  } catch {
    folderStillExists = false;
  }

  if (folderStillExists) {
    backupList[chosenPath].enabled = true;
    configStore.set('backupList', backupList);
  } else {
    return createBackup(chosenPath);
  }
}

async function fetchFolder(folderId: number) {
  const res = await fetch(
    `${process.env.API_URL}/storage/v2/folder/${folderId}`,
    {
      method: 'GET',
      headers: getHeaders(true),
    }
  );

  const responseBody = await res.json().catch(() => null);

  if (res.ok) {
    if (responseBody?.deleted || responseBody?.removed) {
      throw new Error('Folder does not exist');
    }
    return responseBody;
  }
  throw new Error('Unsuccesful request to fetch folder');
}

export async function fetchFolderTree(folderUuid: string): Promise<{
  tree: FolderTree;
  folderDecryptedNames: Record<number, string>;
  fileDecryptedNames: Record<number, string>;
  size: number;
}> {
  const res = await fetch(
    `${process.env.NEW_DRIVE_URL}/folders/${folderUuid}/tree`,
    {
      method: 'GET',
      headers: getNewApiHeaders(),
    }
  );

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
        fileDecryptedNames[file.id] = aes.decrypt(
          file.name,
          `${process.env.NEW_CRYPTO_KEY}-${file.folderId}`
        );
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
  logger.info(
    `[BACKUPS] Downloading Device: "${device.name}", ChosenPath "${chosenPath}"`
  );

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
  }
): Promise<void> {
  if (!device.id) {
    throw new Error('This backup has not been uploaded yet');
  }

  const user = getUser();
  if (!user) {
    throw new Error('No saved user');
  }

  const folder = await fetchFolder(device.id);
  if (!folder || !folder.uuid || folder.uuid.length === 0) {
    throw new Error('No backup data found');
  }

  const networkApiUrl = process.env.BRIDGE_URL;
  const bridgeUser = user.bridgeUser;
  const bridgePass = user.userId;
  const encryptionKey = user.mnemonic;

  await downloadFolderAsZip(
    device.name,
    networkApiUrl,
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
    }
  );
}

function deleteFolder(folderId: number) {
  return fetch(`${process.env.API_URL}/storage/folder/${folderId}`, {
    method: 'DELETE',
    headers: getHeaders(true),
  });
}

export async function deleteBackup(
  backup: BackupInfo,
  isCurrent?: boolean
): Promise<void> {
  const res = await deleteFolder(backup.folderId);
  if (!res.ok) {
    throw new Error('Request to delete backup wasnt succesful');
  }

  if (isCurrent) {
    const backupsList = configStore.get('backupList');

    const entriesFiltered = Object.entries(backupsList).filter(
      ([, b]) => b.folderId !== backup.folderId
    );

    const backupListFiltered = Object.fromEntries(entriesFiltered);

    configStore.set('backupList', backupListFiltered);
  }
}

export async function deleteBackupsFromDevice(
  device: Device,
  isCurrent?: boolean
): Promise<void> {
  const backups = await getBackupsFromDevice(device, isCurrent);
  logger.info(`[BACKUPS] Deleting ${backups.length} backups from device`);
  logger.debug(`[BACKUPS] Backups: ${JSON.stringify(backups)}`);

  let deletionPromises: Promise<any>[] = backups.map((backup) =>
    deleteBackup(backup, isCurrent)
  );
  await Promise.all(deletionPromises);

  // delete backups that are not in the backup list
  const { tree } = await fetchFolderTree(device.uuid);
  const foldersToDelete = tree.children.filter(
    (folder) => !backups.some((backup) => backup.folderId === folder.id)
  );
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
    logger.error('Error disabling backup folder', error);
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

  const res = await fetch(
    `${process.env.API_URL}/storage/folder/${existingBackup.folderId}/meta`,
    {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        metadata: { itemName: path.basename(chosenPath) },
      }),
    }
  );

  if (!res.ok) {
    throw new Error('Error in the request to rename a backup');
  }

  delete backupsList[currentPath];

  backupsList[chosenPath] = existingBackup;

  configStore.set('backupList', backupsList);

  return true;
}

function findBackupPathnameFromId(id: number): string | undefined {
  const backupsList = configStore.get('backupList');
  const entryfound = Object.entries(backupsList).find(
    ([, b]) => b.folderId === id
  );

  return entryfound?.[0];
}

export async function createBackupsFromLocalPaths(folderPaths: string[]) {
  configStore.set('backupsEnabled', true);

  await getOrCreateDevice();

  const operations = folderPaths.map((folderPath) => createBackup(folderPath));

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

  const itemPath =
    chosenPath +
    (chosenPath[chosenPath.length - 1] === path.sep ? '' : path.sep);

  const itemName = path.basename(itemPath);

  return {
    path: itemPath,
    itemName,
  };
}

export async function getMultiplePathsFromDialog(
  allowFiles = false
): Promise<PathInfo[] | null> {
  const result = await dialog.showOpenDialog({
    properties: [
      'multiSelections' as const,
      ...(allowFiles ? (['openFile'] as const) : ['openDirectory' as const]),
    ],
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
    })
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
