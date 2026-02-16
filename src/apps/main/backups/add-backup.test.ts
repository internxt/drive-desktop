import * as getPathFromDialogModule from '../../../backend/features/backup/get-path-from-dialog';
import * as createBackupModule from './create-backup';
import * as DeviceModuleModule from './../../../backend/features/device/device.module';
import * as enableExistingBackupModule from './enable-existing-backup';
import * as fetchDeviceModule from '../../../backend/features/device/fetchDevice';
import configStoreModule from '../config';
import { addBackup } from './add-backup';
import { loggerMock } from 'tests/vitest/mocks.helper';
import { call, partialSpyOn } from 'tests/vitest/utils.helper';

const mockedGetPathFromDialog = partialSpyOn(getPathFromDialogModule, 'getPathFromDialog');
const mockedConfigStoreGet = partialSpyOn(configStoreModule, 'get');
const mockedCreateBackup = partialSpyOn(createBackupModule, 'createBackup');
const mockedGetOrCreateDevice = partialSpyOn(DeviceModuleModule.DeviceModule, 'getOrCreateDevice');
const mockedEnableExistingBackup = partialSpyOn(enableExistingBackupModule, 'enableExistingBackup');
const mockedFetchDevice = partialSpyOn(fetchDeviceModule, 'fetchDevice');

describe('addBackup', () => {
  const mockDevice = {
    id: 123,
    bucket: 'test-bucket',
    uuid: 'device-uuid',
    name: 'Test Device',
    removed: false,
    hasBackups: false,
  };

  beforeEach(() => {
    mockedFetchDevice.mockResolvedValue({ error: undefined, data: mockDevice });
  });

  it('should throw error when device is not found', async () => {
    const mockError = new Error('Device not found');
    mockedGetOrCreateDevice.mockResolvedValue({ error: mockError, data: undefined });

    await expect(addBackup()).rejects.toThrow('Error message');
    call(loggerMock.error).toMatchObject({
      msg: 'Error adding backup: No device found',
    });
  });

  it('should return undefined when no path is chosen', async () => {
    mockedGetOrCreateDevice.mockResolvedValue({ error: undefined, data: mockDevice });
    mockedGetPathFromDialog.mockResolvedValue(null);

    const result = await addBackup();

    expect(result).toBeUndefined();
  });

  it('should create new backup when backup does not exist', async () => {
    const chosenPath = '/path/to/backup';
    const mockBackupInfo = {
      folderUuid: 'folder-uuid',
      folderId: 123,
      pathname: chosenPath,
      name: 'backup',
      tmpPath: '/tmp',
      backupsBucket: 'test-bucket',
    };

    mockedGetOrCreateDevice.mockResolvedValue({ error: undefined, data: mockDevice });
    mockedGetPathFromDialog.mockResolvedValue({ path: chosenPath, itemName: 'backup' });
    mockedConfigStoreGet.mockReturnValue({});
    mockedCreateBackup.mockResolvedValue(mockBackupInfo);

    const result = await addBackup();

    call(mockedCreateBackup).toMatchObject({
      pathname: chosenPath,
      device: mockDevice,
    });
    expect(result).toStrictEqual(mockBackupInfo);
  });

  it('should enable existing backup when backup exists', async () => {
    const chosenPath = '/path/to/existing';
    const existingBackupData = {
      folderUuid: 'existing-uuid',
      folderId: 456,
      enabled: false,
    };
    const mockBackupInfo = {
      folderUuid: 'existing-uuid',
      folderId: 456,
      pathname: chosenPath,
      name: 'existing',
      tmpPath: '/tmp',
      backupsBucket: 'test-bucket',
    };

    mockedGetOrCreateDevice.mockResolvedValue({ error: undefined, data: mockDevice });
    mockedGetPathFromDialog.mockResolvedValue({ path: chosenPath, itemName: 'existing' });
    mockedConfigStoreGet.mockReturnValue({ [chosenPath]: existingBackupData });
    mockedEnableExistingBackup.mockResolvedValue(mockBackupInfo);

    const result = await addBackup();

    call(mockedEnableExistingBackup).toMatchObject([chosenPath, mockDevice]);
    expect(result).toStrictEqual(mockBackupInfo);
  });
});
