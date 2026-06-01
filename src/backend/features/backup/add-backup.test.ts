import * as getPathFromDialogModule from '../../../core/utils/get-path-from-dialog';
import * as createBackupModule from './create-backup';
import * as DeviceModuleModule from './../../../backend/features/device/device.module';
import * as enableExistingBackupModule from './enable-existing-backup';
import * as fetchDeviceModule from '../../../backend/features/device/fetchDevice';
import configStoreModule from '../../../apps/main/config';
import { createAbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
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

    const result = await addBackup();

    expect(result).toMatchObject({ error: expect.any(Error) });
    call(loggerMock.error).toMatchObject({
      msg: 'Error fetching or creating device',
    });
  });

  it('should return undefined when no path is chosen', async () => {
    mockedGetOrCreateDevice.mockResolvedValue({ error: undefined, data: mockDevice });
    mockedGetPathFromDialog.mockResolvedValue(null);

    const result = await addBackup();

    expect(result).toMatchObject({ error: expect.any(Error) });
  });

  it('should create new backup when backup does not exist', async () => {
    const chosenPath = createAbsolutePath('/path/to/backup');
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
    mockedCreateBackup.mockResolvedValue({ data: mockBackupInfo } as never);

    const result = await addBackup();

    call(mockedCreateBackup).toMatchObject({
      pathname: chosenPath,
      device: mockDevice,
    });
    expect(result).toStrictEqual({ data: mockBackupInfo });
  });

  it('should enable existing backup when backup exists', async () => {
    const chosenPath = createAbsolutePath('/path/to/existing');
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
    mockedEnableExistingBackup.mockResolvedValue({ data: mockBackupInfo } as never);

    const result = await addBackup();

    call(mockedEnableExistingBackup).toMatchObject({
      pathname: chosenPath,
      device: mockDevice,
    });
    expect(result).toStrictEqual({ data: mockBackupInfo });
  });
});
