import { aes } from '@internxt/lib';
import { app, dialog } from 'electron';
import fetch from 'electron-fetch';
import logger from 'electron-log';
import os from 'os';
import path from 'path';
import { IpcMainEvent, ipcMain } from 'electron';
import fs from 'fs';
import { FolderTree } from '@internxt/sdk/dist/drive/storage/types';
import {
  getHeaders,
  getNewApiHeaders,
  getUser,
  setUser,
} from '../auth/service';
import { addGeneralIssue } from '../background-processes/process-issues';
import configStore from '../config';
import { BackupInfo } from '../../backups/BackupInfo';
import { PathLike } from 'fs';
import { downloadFolder } from '../network/download';
import Logger from 'electron-log';
import { broadcastToWindows } from '../windows';
import { randomUUID } from 'crypto';

export type Device = {
  name: string;
  id: number;
  uuid: string;
  bucket: string;
  removed: boolean;
  hasBackups: boolean;
};

type DeviceDTO = {
  id: number;
  uuid: string;
  name: string;
  bucket: string;
  removed: boolean;
  hasBackups: boolean;
};

export interface FolderTreeResponse {
  tree: FolderTree;
  folderDecryptedNames: Record<number, string>;
  fileDecryptedNames: Record<number, string>;
  size: number;
  totalItems: number;
}

export const addUnknownDeviceIssue = (error: Error) => {
  addGeneralIssue({
    errorName: 'UNKNOWN_DEVICE_NAME',
    action: 'GET_DEVICE_NAME_ERROR',
    process: 'GENERAL',
    errorDetails: {
      name: error.name,
      message: error.message,
      stack: error.stack || '',
    },
  });
  addGeneralIssue({
    errorName: 'UNKNOWN_DEVICE_NAME',
    action: 'GET_DEVICE_NAME_ERROR',
    process: 'GENERAL',
    errorDetails: {
      name: error.name,
      message: error.message,
      stack: error.stack || '',
    },
  });
};

function createDevice(deviceName: string) {
  return fetch(`${process.env.API_URL}/backup/deviceAsFolder`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ deviceName }),
  });
}

export async function getDevices(): Promise<Array<Device>> {
  const response = await fetch(`${process.env.API_URL}/backup/deviceAsFolder`, {
    method: 'GET',
    headers: getHeaders(true),
  });

  const devices = ((await response.json()) as Array<DeviceDTO>) || [];

  return devices
    .filter(({ removed, hasBackups }) => !removed && hasBackups)
    .map((device) => decryptDeviceName(device));
}

async function tryToCreateDeviceWithDifferentNames(): Promise<Device> {
  let res = await createDevice(os.hostname());

  let i = 1;

  while (res.status === 409 && i <= 10) {
    const deviceName = `${os.hostname()} (${i})`;
    logger.info(`[DEVICE] Creating device with name "${deviceName}"`);
    res = await createDevice(deviceName);
    i++;
  }

  if (!res.ok) {
    const deviceName = `${new Date().valueOf() % 1000}`;
    logger.info(`[DEVICE] Creating device with name "${deviceName}"`);
    res = await createDevice(`${os.hostname()} (${deviceName})`);
  }

  if (res.ok) {
    return res.json();
  }
  const error = new Error('Could not create device trying different names');
  addUnknownDeviceIssue(error);
  throw error;
}
export async function getOrCreateDevice() {
  const savedDeviceId = configStore.get('deviceId');

  Logger.info(`[DEVICE] Saved device id: ${savedDeviceId}`);

  const deviceIsDefined = savedDeviceId !== -1;

  Logger.info(`[DEVICE] Device is defined: ${deviceIsDefined}`);

  let newDevice: Device | null = null;

  if (deviceIsDefined) {
    const res = await fetch(
      `${process.env.API_URL}/backup/deviceAsFolder/${savedDeviceId}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (res.ok) {
      const device = decryptDeviceName(await res.json());
      Logger.info(`[DEVICE] Found device with name "${device.name}"`);
      configStore.set('deviceUuid', device.uuid);

      Logger.info(device);

      if (!device.removed) return device;
      newDevice = await tryToCreateDeviceWithDifferentNames();
    }
    if (res.status === 404) {
      newDevice = await tryToCreateDeviceWithDifferentNames();
    }
  } else {
    newDevice = await tryToCreateDeviceWithDifferentNames();
  }

  if (newDevice) {
    configStore.set('deviceId', newDevice.id);
    configStore.set('deviceUuid', newDevice.uuid);
    configStore.set('backupList', {});
    const device = decryptDeviceName(newDevice);
    logger.info(`[DEVICE] Created device with name "${device.name}"`);

    Logger.info(device);
    return device;
  }
  const error = new Error('Could not get or create device');
  addUnknownDeviceIssue(error);
  throw error;
}

export async function renameDevice(deviceName: string): Promise<Device> {
  const deviceId = getDeviceId();

  const res = await fetch(
    `${process.env.API_URL}/backup/deviceAsFolder/${deviceId}`,
    {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ deviceName }),
    }
  );
  if (res.ok) {
    return decryptDeviceName(await res.json());
  }
  throw new Error('Error in the request to rename a device');
}

function decryptDeviceName({ name, ...rest }: Device): Device {
  let nameDevice;
  let key;
  try {
    key = `${process.env.NEW_CRYPTO_KEY}-${rest.bucket}`;
    nameDevice = aes.decrypt(name, key);
  } catch (error) {
    key = `${process.env.NEW_CRYPTO_KEY}-${null}`;
    nameDevice = aes.decrypt(name, key);
  }

  Logger.info(`[DEVICE] Decrypted device name "${nameDevice}"`);

  return {
    name: nameDevice,
    ...rest,
  };
}

export type Backup = { id: number; name: string; uuid: string };

export async function getBackupsFromDevice(
  device: Device,
  isCurrent?: boolean
): Promise<Array<BackupInfo>> {
  const folder = await fetchFolder(device.id);

  if (isCurrent) {
    const backupsList = configStore.get('backupList');

    const user = getUser();

    if (user && !user?.backupsBucket) {
      user.backupsBucket = device.bucket;
      setUser(user);
    }

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
  const deviceId = getDeviceId();
  try {
    const res = await fetch(`${process.env.API_URL}/storage/folder`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ parentFolderId: deviceId, folderName: name }),
    });
    return res.json();
  } catch (error) {
    logger.error(error);
    throw new Error('Post backup request wasnt successful');
  }
}

/**
 * Creates a backup given a local folder path
 * @param pathname Path to the local folder for the backup
 */
async function createBackup(pathname: string): Promise<void> {
  const { base } = path.parse(pathname);

  logger.debug(`[BACKUPS] Creating backup for ${base}`);

  const newBackup = await postBackup(base);

  logger.debug(`[BACKUPS] Created backup with id ${newBackup.uuid}`);

  const backupList = configStore.get('backupList');

  backupList[pathname] = { enabled: true, folderId: newBackup.id };

  logger.debug(`[BACKUPS] Backup list: ${JSON.stringify(backupList)}`);

  configStore.set('backupList', backupList);
}

export async function addBackup(): Promise<void> {
  try {
    const chosenItem = await getPathFromDialog();
    if (!chosenItem || !chosenItem.path) {
      return;
    }

    const chosenPath = chosenItem.path;
    logger.debug(`[BACKUPS] Chosen item: ${chosenItem.path}`);

    const backupList = configStore.get('backupList');

    Logger.debug(`[BACKUPS] Backup list: ${JSON.stringify(backupList)}`);
    const existingBackup = backupList[chosenPath];

    logger.debug(`[BACKUPS] Existing backup: ${existingBackup}`);

    if (!existingBackup) {
      return createBackup(chosenPath);
    }

    let folderStillExists;
    try {
      const existFolder = await fetchFolder(existingBackup.folderId);
      folderStillExists = !existFolder.removed;
    } catch {
      folderStillExists = false;
    }

    if (folderStillExists) {
      backupList[chosenPath].enabled = true;
      configStore.set('backupList', backupList);
    } else {
      return createBackup(chosenPath);
    }
  } catch (error) {
    logger.error(error);
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

  if (res.ok) {
    return res.json();
  }
  throw new Error('Unsuccesful request to fetch folder');
}
async function fetchFolders(foldersId: number[]) {
  const folders = [];
  for (const folderId of foldersId) {
    const folder = await fetchFolder(folderId);
    folders.push(folder);
  }
  return folders;
}

async function fetchTreeFromApi(folderUuid: string): Promise<FolderTree> {
  const res = await fetch(
    `${process.env.NEW_DRIVE_URL}/drive/folders/${folderUuid}/tree`,
    {
      method: 'GET',
      headers: getNewApiHeaders(),
    }
  );

  if (!res.ok) {
    throw new Error(
      `Unsuccessful request to fetch folder tree for ID: ${folderUuid}`
    );
  }

  const { tree } = (await res.json()) as { tree: FolderTree };
  return tree;
}

function processFolderTree(tree: FolderTree) {
  let size = 0;
  const folderDecryptedNames: Record<number, string> = {};
  const fileDecryptedNames: Record<number, string> = {};
  const pendingFolders = [tree];
  let totalItems = 0;

  while (pendingFolders.length > 0) {
    const currentTree = pendingFolders.shift()!;
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
      totalItems++;
    }

    pendingFolders.push(...folders);
  }

  return { size, folderDecryptedNames, fileDecryptedNames, totalItems };
}

export async function fetchFolderTree(
  folderUuid: string
): Promise<FolderTreeResponse> {
  const tree = await fetchTreeFromApi(folderUuid);
  const { size, folderDecryptedNames, fileDecryptedNames, totalItems } =
    processFolderTree(tree);

  return { tree, folderDecryptedNames, fileDecryptedNames, size, totalItems };
}

export async function fetchArrayFolderTree(
  folderUuids: string[]
): Promise<FolderTreeResponse> {
  const trees: FolderTree[] = [];
  const folderDecryptedNames: Record<number, string> = {};
  const fileDecryptedNames: Record<number, string> = {};
  let totalSize = 0;
  let totalItemsInTree = 0;

  for (const folderUuid of folderUuids) {
    const tree = await fetchTreeFromApi(folderUuid);
    trees.push(tree);

    const {
      size,
      folderDecryptedNames: folderNames,
      fileDecryptedNames: fileNames,
      totalItems,
    } = processFolderTree(tree);

    totalSize += size;
    totalItemsInTree += totalItems;
    Object.assign(folderDecryptedNames, folderNames);
    Object.assign(fileDecryptedNames, fileNames);
  }

  let combinedTree: FolderTree = trees[0];
  if (trees.length > 1) {
    combinedTree = {
      id: 0,
      bucket: trees[0].bucket,
      children: trees,
      encrypt_version: trees[0].encrypt_version,
      files: [],
      name: 'Multiple Folders',
      plainName: 'Multiple Folders',
      parentId: 0,
      userId: trees[0].userId,
      uuid: randomUUID(),
      parentUuid: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      size: totalSize,
      type: 'folder',
      deleted: false,
      removed: false,
    };
  }

  return {
    tree: combinedTree,
    folderDecryptedNames,
    fileDecryptedNames,
    size: totalSize,
    totalItems: totalItemsInTree,
  };
}

export async function deleteBackup(
  backup: BackupInfo,
  isCurrent?: boolean
): Promise<void> {
  const res = await fetch(
    `${process.env.API_URL}/storage/folder/${backup.folderId}`,
    {
      method: 'DELETE',
      headers: getHeaders(true),
    }
  );
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

  const deletionPromises = backups.map((backup) =>
    deleteBackup(backup, isCurrent)
  );
  await Promise.all(deletionPromises);
}

export async function disableBackup(backup: BackupInfo): Promise<void> {
  const backupsList = configStore.get('backupList');
  const pathname = findBackupPathnameFromId(backup.folderId)!;

  await deleteBackup(backup);

  backupsList[pathname].enabled = false;

  configStore.set('backupList', backupsList);
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

async function downloadDeviceBackupZip(
  device: Device,
  foldersIdToDownload: number[],
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
  Logger.info(`[BACKUPS] Downloading backup for device ${device.name}`);

  const folders = await fetchFolders(foldersIdToDownload);

  const networkApiUrl = process.env.BRIDGE_URL;
  const bridgeUser = user.bridgeUser;
  const bridgePass = user.userId;
  const encryptionKey = user.mnemonic;

  await downloadFolder(
    device.name,
    networkApiUrl,
    folders.map((folder) => folder.uuid),
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

export async function downloadBackup(
  device: Device,
  foldersId?: number[]
): Promise<void> {
  const chosenItem = await getPathFromDialog();
  if (!chosenItem || !chosenItem.path) {
    return;
  }

  const chosenPath = chosenItem.path;
  logger.info(
    `[BACKUPS] Downloading Device: "${device.name}", ChosenPath "${chosenPath}"`
  );
  logger.info(`[BACKUPS] Folders id to download: ${foldersId}`);

  const date = new Date();
  const now =
    String(date.getFullYear()) +
    String(date.getMonth() + 1) +
    String(date.getDay()) +
    String(date.getHours()) +
    String(date.getMinutes()) +
    String(date.getSeconds());
  const zipFilePath = chosenPath + 'Backup_' + now + '';
  // const zipFilePath = chosenPath + 'Backup_' + now + '.zip';

  Logger.info(`[BACKUPS] Downloading backup to ${zipFilePath}`);

  const abortController = new AbortController();

  const abortListener = (_: IpcMainEvent, abortDeviceUuid: string) => {
    if (abortDeviceUuid === device.uuid) {
      try {
        Logger.info(`[BACKUPS] Aborting download for device ${device.name}`);
        if (abortController && !abortController.signal.aborted) {
          abortController.abort();
          fs.unlinkSync(zipFilePath);
        }
      } catch (error) {
        Logger.error(`[BACKUPS] Error while aborting download: ${error}`);
      }
    }
  };

  const listenerName = 'abort-download-backups-' + device.uuid;

  const removeListenerIpc = ipcMain.on(listenerName, abortListener);

  try {
    const foldersIdToDownload = foldersId?.length ? foldersId : [device.id];
    Logger.info(`[BACKUPS] Folders to download: ${foldersIdToDownload}`);
    Logger.info(`[BACKUPS] Folders to download: ${foldersIdToDownload.length}`);
    await downloadDeviceBackupZip(device, foldersIdToDownload, zipFilePath, {
      updateProgress: (progress: number) => {
        if (abortController?.signal.aborted) return;
        Logger.info(`[BACKUPS] Download progress: ${progress}`);
        broadcastToWindows('backup-download-progress', {
          id: device.uuid,
          progress: Math.round(progress),
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

function getDeviceId(): number {
  const deviceId = configStore.get('deviceId');

  if (deviceId === -1) {
    throw new Error('deviceId is not defined');
  }

  return deviceId;
}

export async function createBackupsFromLocalPaths(folderPaths: string[]) {
  configStore.set('backupsEnabled', true);

  await getOrCreateDevice();

  const operations = folderPaths.map((folderPath) => createBackup(folderPath));

  await Promise.all(operations);
}

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
