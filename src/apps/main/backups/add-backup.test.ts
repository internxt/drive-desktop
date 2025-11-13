import { addBackup } from './add-backup';
import { getPathFromDialog } from '../device/service';
import configStore from '../config';
import { createBackup } from './create-backup';
import { DeviceModule } from './../../../backend/features/device/device.module';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { enableExistingBackup } from './enable-existing-backup';

jest.mock('../device/service');
jest.mock('../config');
jest.mock('./create-backup');
jest.mock('./../../../backend/features/device/device.module');
jest.mock('./enable-existing-backup');
jest.mock('../../../backend/features/device/fetchDevice', () => ({
  fetchDevice: jest.fn(),
}));

const mockedGetPathFromDialog = jest.mocked(getPathFromDialog);
const mockedConfigStore = jest.mocked(configStore);
const mockedCreateBackup = jest.mocked(createBackup);
const mockedDeviceModule = jest.mocked(DeviceModule);
const mockedLogger = jest.mocked(logger);
const mockedEnableExistingBackup = jest.mocked(enableExistingBackup);

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
    jest.clearAllMocks();
  });

  it('should throw error when device is not found', async () => {
    const mockError = new Error('Device not found');
    mockedDeviceModule.getOrCreateDevice.mockResolvedValue(mockError);
    mockedLogger.error.mockImplementation(() => {
      throw new Error('Error message');
    });

    await expect(addBackup()).rejects.toThrow('Error message');
    expect(mockedLogger.error).toBeCalledWith({
      tag: 'BACKUPS',
      msg: 'Error adding backup: No device found',
    });
  });

  it('should return undefined when no path is chosen', async () => {
    mockedDeviceModule.getOrCreateDevice.mockResolvedValue(mockDevice);
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

    mockedDeviceModule.getOrCreateDevice.mockResolvedValue(mockDevice);
    mockedGetPathFromDialog.mockResolvedValue({ path: chosenPath, itemName: 'backup' });
    mockedConfigStore.get.mockReturnValue({});
    mockedCreateBackup.mockResolvedValue(mockBackupInfo);

    const result = await addBackup();

    expect(mockedCreateBackup).toBeCalledWith({
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

    mockedDeviceModule.getOrCreateDevice.mockResolvedValue(mockDevice);
    mockedGetPathFromDialog.mockResolvedValue({ path: chosenPath, itemName: 'existing' });
    mockedConfigStore.get.mockReturnValue({ [chosenPath]: existingBackupData });
    mockedEnableExistingBackup.mockResolvedValue(mockBackupInfo);

    const result = await addBackup();

    expect(mockedEnableExistingBackup).toBeCalledWith(chosenPath, mockDevice);
    expect(result).toStrictEqual(mockBackupInfo);
  });
});
