/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-use-before-define */
import { dialog } from 'electron';
import os from 'node:os';
import path from 'node:path';
import electronStore from '../config';
import { BackupInfo } from '../../backups/BackupInfo';
import { PathTypeChecker } from '../../shared/fs/PathTypeChecker';
import { logger } from '@/apps/shared/logger/logger';
import { client } from '@/apps/shared/HttpClient/client';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { getBackupsFromDevice } from './get-backups-from-device';
import { FolderUuid } from '../database/entities/DriveFolder';
import { AuthContext } from '@/apps/sync-engine/config';

export type Device = {
  plainName: string;
  id: number;
  uuid: string;
  removed: boolean;
  hasBackups: boolean;
  lastBackupAt: string;
  bucket: string;
};

export async function getDevices(): Promise<Array<Device>> {
  const { data } = await driveServerWipModule.backup.getDevices();
  const devices = data ?? [];
  return devices.filter(({ removed, hasBackups }) => !removed && hasBackups);
}

export function saveDeviceToConfig(device: Device) {
  electronStore.set('deviceUuid', device.uuid);
  electronStore.set('backupList', {});
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

  for (const deviceName of nameVariants) {
    const { data, error } = await driveServerWipModule.backup.createDevice({ deviceName });

    if (data) return { data };
    if (error.code !== 'ALREADY_EXISTS') return { error };
  }

  const msg = 'Could not create device trying different names';
  logger.error({ tag: 'BACKUPS', msg });
  return { error: new Error(msg) };
}

async function createNewDevice() {
  const { data, error } = await createUniqueDevice();
  if (data) {
    saveDeviceToConfig(data);
    return { data };
  }
  return { error };
}

export async function getOrCreateDevice() {
  const deviceUuid = electronStore.get('deviceUuid');
  logger.debug({ tag: 'BACKUPS', msg: 'Saved device', deviceUuid });

  if (deviceUuid === '') {
    return createNewDevice();
  }

  const { data, error } = await driveServerWipModule.backup.getDevice({ deviceUuid });

  if (error) {
    if (error.code === 'NOT_FOUND') {
      return createNewDevice();
    } else {
      return { error };
    }
  }

  if (data.removed) {
    return createNewDevice();
  }

  return { data };
}

export async function renameDevice(deviceName: string): Promise<Device> {
  const deviceUuid = getDeviceUuid();

  const res = await driveServerWipModule.backup.updateDevice({ deviceUuid, deviceName });

  if (res.data) {
    return res.data;
  }

  throw new Error('Error in the request to rename a device');
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
    throw logger.error({ tag: 'BACKUPS', msg: 'Post backup request was not successful', error: res.error });
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

  const backupList = electronStore.get('backupList');

  backupList[pathname] = { enabled: true, folderId: newBackup.id, folderUuid: newBackup.uuid };

  logger.debug({ msg: '[BACKUPS] Backup list', backupList });

  electronStore.set('backupList', backupList);
}

export async function addBackup(): Promise<void> {
  try {
    const chosenItem = await getPathFromDialog();
    if (!chosenItem || !chosenItem.path) {
      return;
    }

    const chosenPath = chosenItem.path;
    logger.debug({ msg: '[BACKUPS] Chosen item', chosenPath });

    const backupList = electronStore.get('backupList');

    logger.debug({ msg: '[BACKUPS] Backup list', backupList });
    const existingBackup = backupList[chosenPath];

    logger.debug({ msg: '[BACKUPS] Existing backup', existingBackup });

    if (!existingBackup) {
      return createBackup(chosenPath);
    }

    const { data } = await driveServerWipModule.backup.fetchFolder({ folderUuid: existingBackup.folderUuid });

    if (data && data.status === 'EXISTS') {
      backupList[chosenPath].enabled = true;
      electronStore.set('backupList', backupList);
    } else {
      return createBackup(chosenPath);
    }
  } catch (error) {
    logger.error({ tag: 'BACKUPS', msg: 'Error adding backup', error });
  }
}

async function deleteBackup({ ctx, backup, isCurrent }: { ctx: AuthContext; backup: BackupInfo; isCurrent?: boolean }) {
  const res = await driveServerWipModule.storage.deleteFolderByUuid({
    ctx,
    context: {
      path: backup.pathname,
      uuid: backup.folderUuid as FolderUuid,
    },
  });

  if (res.error) {
    throw new Error('Request to delete backup wasnt succesful');
  }

  if (isCurrent) {
    const backupsList = electronStore.get('backupList');

    const entriesFiltered = Object.entries(backupsList).filter(([, b]) => b.folderId !== backup.folderId);

    const backupListFiltered = Object.fromEntries(entriesFiltered);

    electronStore.set('backupList', backupListFiltered);
  }
}

export async function deleteBackupsFromDevice({ ctx, device, isCurrent }: { ctx: AuthContext; device: Device; isCurrent?: boolean }) {
  const backups = await getBackupsFromDevice(device, isCurrent);
  const deletionPromises = backups.map((backup) => deleteBackup({ ctx, backup, isCurrent }));
  await Promise.all(deletionPromises);
}

export async function disableBackup(folderId: number): Promise<void> {
  const backupsList = electronStore.get('backupList');
  const pathname = findBackupPathnameFromId(folderId)!;

  backupsList[pathname].enabled = false;

  electronStore.set('backupList', backupsList);
}

export function findBackupPathnameFromId(id: number): string | undefined {
  const backupsList = electronStore.get('backupList');
  const entryfound = Object.entries(backupsList).find(([, b]) => b.folderId === id);

  return entryfound?.[0];
}

function getDeviceUuid(): string {
  const deviceUuid = electronStore.get('deviceUuid');

  if (deviceUuid === '') {
    throw new Error('deviceUuid is not defined');
  }

  return deviceUuid;
}

export async function getPathFromDialog() {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });

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

export async function getMultiplePathsFromDialog(getFiles?: boolean) {
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
