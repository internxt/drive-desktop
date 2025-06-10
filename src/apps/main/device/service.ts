/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-use-before-define */
import { aes } from '@internxt/lib';
import { app, dialog } from 'electron';
import fetch from 'electron-fetch';
import os from 'os';
import path from 'path';
import { IpcMainEvent, ipcMain } from 'electron';
import { FolderTree } from '@internxt/sdk/dist/drive/storage/types';
import { getNewApiHeaders, getUser, setUser } from '../auth/service';
import configStore from '../config';
import { BackupInfo } from '../../backups/BackupInfo';
import fs, { PathLike } from 'fs';
import { downloadFolder } from '../network/download';
import Logger from 'electron-log';
import { broadcastToWindows } from '../windows';
import { randomUUID } from 'crypto';
import { PathTypeChecker } from '../../shared/fs/PathTypeChecker ';
import { logger } from '@/apps/shared/logger/logger';
import { client } from '@/apps/shared/HttpClient/client';
import { getConfig } from '@/apps/sync-engine/config';
import { BackupFolderUuid } from './backup-folder-uuid';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { addGeneralIssue } from '@/apps/main/background-processes/issues';
import { AlreadyExistsError, NotFoundError } from '@/infra/drive-server-wip/out/error.types';

export type Device = {
  name: string;
  id: number;
  uuid: string;
  bucket: string;
  removed: boolean;
  hasBackups: boolean;
  lastBackupAt: string;
};

interface FolderTreeResponse {
  tree: FolderTree;
  folderDecryptedNames: Record<number, string>;
  fileDecryptedNames: Record<number, string>;
  size: number;
  totalItems: number;
}

/**
 * V2.5.5
 * Alexis Mora
 * TODO: Change this to accept an errorMessage instead of an Error object,
 * since this function only uses the message from the error
 */
export const addUnknownDeviceIssue = (error: Error) => {
  addGeneralIssue({
    name: error.name,
    error: 'UNKNOWN_DEVICE_NAME',
  });
};

export async function getDevices(): Promise<Array<Device>> {
  const { data } = await driveServerWipModule.backup.getDevices();
  const devices = data ?? [];
  return devices.filter(({ removed, hasBackups }) => !removed && hasBackups).map((device) => decryptDeviceName(device));
}

/**
 * Checks if a device exists with the given UUID
 * @param deviceUuid The UUID of the device to check
 * @returns an object containing the device data if found, null if not found,
 *  or an object with an error if there was an issue fetching the device
 */
export async function fetchDevice(deviceUuid: string) {
  const { data, error } = await driveServerWipModule.backup.getDevice({ deviceUuid });

  if (data) {
    const device = decryptDeviceName(data);
    logger.info({ tag: 'DEVICE', msg: 'Found device', device: device.name });
    return { data: device };
  }
  if (error instanceof NotFoundError) {
    const msg = `Device not found for deviceUuid: ${deviceUuid}`;
    logger.info({ tag: 'DEVICE', msg });
    addUnknownDeviceIssue(new Error(msg));
    return { data: null };
  } else {
    return { error: logger.error({ tag: 'DEVICE', msg: 'Error fetching device', error }) };
  }
}

export function saveDeviceToConfig(device: Device) {
  configStore.set('deviceId', device.id);
  configStore.set('deviceUuid', device.uuid);
  configStore.set('backupList', {});
}

async function tryCreateDevice(deviceName: string) {
  const { data, error } = await driveServerWipModule.backup.createDevice({ deviceName });
  if (data) return { data };

  if (error instanceof AlreadyExistsError) {
    const msg = 'Device name already exists';
    logger.info({ tag: 'DEVICE', msg });
    return { error: new Error(msg) };
  }

  return { error: logger.error({ tag: 'DEVICE', msg: 'Error creating device', error }) };
}

/**
 * Creates a new device with a unique name
 * @returns The an object with the created device or
 * an object with the error if device creation fails after multiple attempts
 * @param attempts The number of attempts to create a device with a unique name, defaults to 1000
 */
export async function createUniqueDevice(attempts = 1000) {
  const baseName = os.hostname();
  const nameVariants = [baseName, ...Array.from({ length: attempts }, (_, i) => `${baseName} (${i + 1})`)];

  for (const name of nameVariants) {
    logger.info({ tag: 'DEVICE', msg: `Trying to create device with name "${name}"` });
    const { data, error } = await tryCreateDevice(name);

    if (data) return { data };
    if (error.message == 'Error creating device') return { error };
  }

  const finalError = logger.error({ tag: 'DEVICE', msg: 'Could not create device trying different names' });
  addUnknownDeviceIssue(finalError);
  return { error: finalError };
}

async function createNewDevice() {
  const { data, error } = await createUniqueDevice();
  if (data) {
    saveDeviceToConfig(data);
    return { data: decryptDeviceName(data) };
  }
  return { error };
}

export async function getOrCreateDevice() {
  const savedDeviceUuid = configStore.get('deviceUuid');
  const deviceIsStored = savedDeviceUuid !== '';
  logger.debug({ tag: 'DEVICE', msg: 'Saved device', savedDeviceUuid });

  if (!deviceIsStored) {
    logger.debug({ tag: 'DEVICE', msg: 'No saved device, creating a new one' });
    return createNewDevice();
  }
  const { data, error } = await fetchDevice(savedDeviceUuid);
  if (data && !data.removed) {
    return { data };
  }

  if (data == null && !error) {
    logger.debug({ tag: 'DEVICE', msg: 'Device not found, creating a new one' });
    return createNewDevice();
  }

  if (error) {
    logger.error({ tag: 'DEVICE', msg: 'Error fetching device', error });
    return { error };
  }
  return { error: logger.error({ tag: 'DEVICE', msg: 'Unknown error: Device not found or removed' }) };
}

export async function renameDevice(deviceName: string): Promise<Device> {
  const deviceUuid = getDeviceUuid();

  const res = await driveServerWipModule.backup.updateDevice({ deviceUuid, deviceName });

  if (res.data) {
    return decryptDeviceName(res.data);
  }

  throw new Error('Error in the request to rename a device');
}

export function decryptDeviceName({ name, ...rest }: Device): Device {
  let nameDevice;
  let key;
  try {
    key = `${process.env.NEW_CRYPTO_KEY}-${rest.bucket}`;
    nameDevice = aes.decrypt(name, key);
  } catch (error) {
    key = `${process.env.NEW_CRYPTO_KEY}-${null}`;
    nameDevice = aes.decrypt(name, key);
  }

  logger.debug({ msg: '[DEVICE] Decrypted device', nameDevice });

  return {
    name: nameDevice,
    ...rest,
  };
}

export async function getBackupsFromDevice(device: Device, isCurrent?: boolean): Promise<Array<BackupInfo>> {
  const folder = await fetchFolder({ folderUuid: device.uuid });

  if (isCurrent) {
    const backupsList = configStore.get('backupList');

    await new BackupFolderUuid().ensureBackupUuidExists({ backupsList });

    const user = getUser();

    if (user && !user?.backupsBucket) {
      user.backupsBucket = device.bucket;
      setUser(user);
    }

    return folder.children
      .map((backup) => ({ ...backup, pathname: findBackupPathnameFromId(backup.id) }))
      .filter(({ pathname }) => pathname && backupsList[pathname].enabled)
      .map((backup) => ({
        ...backup,
        pathname: backup.pathname as string,
        folderId: backup.id,
        folderUuid: backup.uuid,
        tmpPath: app.getPath('temp'),
        backupsBucket: device.bucket,
      }));
  } else {
    return folder.children.map((backup) => ({
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
async function postBackup(name: string) {
  const deviceUuid = getDeviceUuid();

  const res = await client.POST('/folders', {
    body: { parentFolderUuid: deviceUuid, plainName: name },
  });

  if (!res.data) {
    logger.error({ tag: 'BACKUPS', msg: 'Post backup request was not successful', error: res.error });
    throw new Error('Post backup request was not successful');
  }

  return res.data;
}

/**
 * Creates a backup given a local folder path
 * @param pathname Path to the local folder for the backup
 */
async function createBackup(pathname: string): Promise<void> {
  const { base } = path.parse(pathname);

  const newBackup = await postBackup(base);

  logger.debug({ msg: '[BACKUPS] Created backup', base, uuid: newBackup.uuid });

  const backupList = configStore.get('backupList');

  backupList[pathname] = { enabled: true, folderId: newBackup.id, folderUuid: newBackup.uuid };

  logger.debug({ msg: '[BACKUPS] Backup list', backupList });

  configStore.set('backupList', backupList);
}

export async function addBackup(): Promise<void> {
  try {
    const chosenItem = await getPathFromDialog();
    if (!chosenItem || !chosenItem.path) {
      return;
    }

    const chosenPath = chosenItem.path;
    Logger.debug(`[BACKUPS] Chosen item: ${chosenItem.path}`);

    const backupList = configStore.get('backupList');

    Logger.debug(`[BACKUPS] Backup list: ${JSON.stringify(backupList)}`);
    const existingBackup = backupList[chosenPath];

    Logger.debug(`[BACKUPS] Existing backup: ${existingBackup}`);

    if (!existingBackup) {
      return createBackup(chosenPath);
    }

    let folderStillExists;
    try {
      const existFolder = await fetchFolder({ folderUuid: existingBackup.folderUuid });
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
    Logger.error(error);
  }
}

async function fetchFolder({ folderUuid }: { folderUuid: string }) {
  const res = await client.GET('/folders/content/{uuid}', {
    params: { path: { uuid: folderUuid } },
  });

  if (!res.data) {
    throw new Error('Unsuccesful request to fetch folder');
  }

  return res.data;
}

async function fetchFolders({ folderUuids }: { folderUuids: string[] }) {
  const folders = await Promise.all(folderUuids.map((folderUuid) => fetchFolder({ folderUuid })));
  return folders;
}

async function fetchTreeFromApi(folderUuid: string): Promise<FolderTree> {
  const res = await fetch(`${process.env.NEW_DRIVE_URL}/folders/${folderUuid}/tree`, {
    method: 'GET',
    headers: getNewApiHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Unsuccessful request to fetch folder tree for ID: ${folderUuid}`);
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
      fileDecryptedNames[file.id] = aes.decrypt(file.name, `${process.env.NEW_CRYPTO_KEY}-${file.folderId}`);
      size += Number(file.size);
      totalItems++;
    }

    pendingFolders.push(...folders);
  }

  return { size, folderDecryptedNames, fileDecryptedNames, totalItems };
}

export async function fetchArrayFolderTree(folderUuids: string[]): Promise<FolderTreeResponse> {
  const trees: FolderTree[] = [];
  const folderDecryptedNames: Record<number, string> = {};
  const fileDecryptedNames: Record<number, string> = {};
  let totalSize = 0;
  let totalItemsInTree = 0;

  for (const folderUuid of folderUuids) {
    const tree = await fetchTreeFromApi(folderUuid);
    trees.push(tree);

    const { size, folderDecryptedNames: folderNames, fileDecryptedNames: fileNames, totalItems } = processFolderTree(tree);

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

export async function deleteBackup(backup: BackupInfo, isCurrent?: boolean): Promise<void> {
  const res = await driveServerWipModule.storage.deleteFolder({ folderId: backup.folderId });

  if (res.error) {
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
  const backups = await getBackupsFromDevice(device, isCurrent);

  const deletionPromises = backups.map((backup) => deleteBackup(backup, isCurrent));
  await Promise.all(deletionPromises);
}

export async function disableBackup(backup: BackupInfo): Promise<void> {
  const backupsList = configStore.get('backupList');
  const pathname = findBackupPathnameFromId(backup.folderId)!;

  backupsList[pathname].enabled = false;

  configStore.set('backupList', backupsList);
}

export async function changeBackupPath(currentPath: string): Promise<string | null> {
  const backupsList = configStore.get('backupList');
  const existingBackup = backupsList[currentPath];

  if (!existingBackup) {
    throw new Error('Backup no longer exists');
  }

  const chosen = await getPathFromDialog();

  if (!chosen || !chosen.path) {
    return null;
  }

  Logger.info(`[BACKUPS] Changing backup path from ${currentPath} to ${chosen.path}`);
  const chosenPath = chosen.path;
  if (backupsList[chosenPath]) {
    throw new Error('A backup with this path already exists');
  }

  const oldFolderName = path.basename(currentPath);
  const newFolderName = path.basename(chosenPath);

  if (oldFolderName !== newFolderName) {
    logger.info({ tag: 'BACKUPS', msg: 'Renaming backup', existingBackup });

    const folderUuid = await new BackupFolderUuid().getBackupFolderUuid({ backup: existingBackup });

    const res = await client.PUT('/folders/{uuid}/meta', {
      params: { path: { uuid: folderUuid } },
      body: { plainName: newFolderName },
    });

    if (!res.data) {
      throw logger.error({
        tag: 'BACKUPS',
        msg: 'Error in the request to rename a backup',
        exc: res.error,
      });
    }
  }

  delete backupsList[currentPath];

  backupsList[chosenPath] = existingBackup;

  configStore.set('backupList', backupsList);

  return chosen.itemName;
}

function findBackupPathnameFromId(id: number): string | undefined {
  const backupsList = configStore.get('backupList');
  const entryfound = Object.entries(backupsList).find(([, b]) => b.folderId === id);

  return entryfound?.[0];
}

async function downloadDeviceBackupZip({
  device,
  folderUuidsToDownload,
  path,
  updateProgress,
  abortController,
}: {
  device: Device;
  folderUuidsToDownload: string[];
  path: PathLike;
  updateProgress: (progress: number) => void;
  abortController?: AbortController;
}) {
  if (!device.id) {
    throw new Error('This backup has not been uploaded yet');
  }

  const user = getUser();
  if (!user) {
    throw new Error('No saved user');
  }
  Logger.info(`[BACKUPS] Downloading backup for device ${device.name}`);

  const folders = await fetchFolders({ folderUuids: folderUuidsToDownload });

  const networkApiUrl = process.env.BRIDGE_URL;
  const bridgeUser = user.bridgeUser;
  const bridgePass = user.userId;
  const encryptionKey = getConfig().mnemonic;

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
    },
  );
}

export async function downloadBackup(device: Device, folderUuids?: string[]): Promise<void> {
  const chosenItem = await getPathFromDialog();
  if (!chosenItem || !chosenItem.path) {
    return;
  }

  const chosenPath = chosenItem.path;
  logger.debug({ tag: 'BACKUPS', msg: 'Downloading device', device: device.name, chosenPath });

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
    const folderUuidsToDownload = folderUuids?.length ? folderUuids : [device.uuid];
    logger.debug({ tag: 'BACKUPS', msg: 'Folders to download', length: folderUuidsToDownload.length });

    await downloadDeviceBackupZip({
      device,
      folderUuidsToDownload,
      path: zipFilePath,
      updateProgress: (progress: number) => {
        if (abortController?.signal.aborted) return;
        logger.debug({ tag: 'BACKUPS', msg: 'Download progress', progress });
        broadcastToWindows('backup-download-progress', {
          id: device.uuid,
          progress: Math.trunc(progress),
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

function getDeviceUuid(): string {
  const deviceUuid = configStore.get('deviceUuid');

  if (deviceUuid === '') {
    throw new Error('deviceUuid is not defined');
  }

  return deviceUuid;
}

export async function createBackupsFromLocalPaths(folderPaths: string[]) {
  configStore.set('backupsEnabled', true);

  const { error } = await getOrCreateDevice();
  if (error) throw error;

  const operations = folderPaths.map((folderPath) => createBackup(folderPath));

  await Promise.all(operations);
}

export async function getUserSystemPath(): Promise<
  | {
      path: string;
      itemName: string;
      isDirectory: boolean;
    }
  | undefined
> {
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

export async function getPathFromDialog(dialogPropertiesOptions?: Electron.OpenDialogOptions['properties']): Promise<{
  path: string;
  itemName: string;
  isDirectory?: boolean;
} | null> {
  const dialogProperties = dialogPropertiesOptions ?? ['openDirectory'];

  const result = await dialog.showOpenDialog({
    properties: dialogProperties,
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

async function openFileSystemAndGetPaths(
  dialogPropertiesOptions?: Electron.OpenDialogOptions['properties'],
): Promise<string[] | undefined> {
  const dialogProperties = dialogPropertiesOptions ?? ['openDirectory'];

  const result = await dialog.showOpenDialog({
    properties: dialogProperties,
  });

  if (result.canceled) {
    return undefined;
  }

  return result.filePaths;
}

export async function getMultiplePathsFromDialog(getFiles?: boolean): Promise<
  | {
      path: string;
      itemName: string;
      isDirectory: boolean;
    }[]
  | undefined
> {
  const fileSelection = getFiles ? 'openFile' : 'openDirectory';

  const chosenItem = await openFileSystemAndGetPaths(['multiSelections', fileSelection]);
  if (!chosenItem) return undefined;

  const paths = await Promise.all(
    chosenItem.map(async (filePath) => {
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
