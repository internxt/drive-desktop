import { aes } from '@internxt/lib';
import { app, dialog } from 'electron';
import fetch from 'electron-fetch';
import logger from 'electron-log';
import os from 'os';
import path from 'path';

import { getHeaders } from '../auth/service';
import configStore from '../config';
import { addAppIssue } from '../issues/app';
import { BackupInfo } from '../../backups/BackupInfo';

export type Device = { name: string; id: number; bucket: string };

type DeviceDTO = {
  bucket: string;
  removed: boolean;
  name: string;
  id: number;
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

  const devices = (await response.json()) as Array<DeviceDTO>;

  return devices
    .filter(({ removed }) => !removed)
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

  const deviceIsDefined = savedDeviceId !== -1;

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
      return decryptDeviceName(await res.json());
    }
    if (res.status === 404) {
      newDevice = await tryToCreateDeviceWithDifferentNames();
    }
  } else {
    newDevice = await tryToCreateDeviceWithDifferentNames();
  }

  if (newDevice) {
    configStore.set('deviceId', newDevice.id);
    configStore.set('backupList', {});
    const device = decryptDeviceName(newDevice);
    logger.info(`[DEVICE] Created device with name "${device.name}"`);

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
  return {
    name: aes.decrypt(name, `${process.env.NEW_CRYPTO_KEY}-${rest.bucket}`),
    ...rest,
  };
}

export type Backup = { id: number; name: string };

export async function getBackupsFromDevice(): Promise<Array<BackupInfo>> {
  const deviceId = getDeviceId();
  const device = await getOrCreateDevice();

  const folder = await fetchFolder(deviceId);

  const backupsList = configStore.get('backupList');

  return folder.children
    .filter((backup: Backup) => {
      const pathname = findBackupPathnameFromId(backup.id);

      return pathname && backupsList[pathname].enabled;
    })
    .map((backup: Backup) => ({
      ...backup,
      pathname: findBackupPathnameFromId(backup.id),
      folderId: backup.id,
      tmpPath: app.getPath('temp'),
      backupsBucket: device.bucket,
    }));
}

/**
 * Posts a Backup to desktop server API
 *
 * @param name Name of the backup folder
 * @returns
 */
async function postBackup(name: string): Promise<Backup> {
  const deviceId = getDeviceId();

  const res = await fetch(`${process.env.API_URL}/storage/folder`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ parentFolderId: deviceId, folderName: name }),
  });
  if (res.ok) {
    return res.json();
  }
  throw new Error('Post backup request wasnt successful');
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

  if (res.ok) {
    return res.json();
  }
  throw new Error('Unsuccesful request to fetch folder');
}

export async function deleteBackup(backup: BackupInfo): Promise<void> {
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

  const backupsList = configStore.get('backupList');

  const entriesFiltered = Object.entries(backupsList).filter(
    ([, b]) => b.folderId !== backup.folderId
  );

  const backupListFiltered = Object.fromEntries(entriesFiltered);

  configStore.set('backupList', backupListFiltered);
}

export async function disableBackup(backup: BackupInfo): Promise<void> {
  const backupsList = configStore.get('backupList');
  const pathname = findBackupPathnameFromId(backup.folderId)!;

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
