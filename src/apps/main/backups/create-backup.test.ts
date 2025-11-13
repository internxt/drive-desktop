import { createBackup } from './create-backup';
import { postBackup } from './post-backup';
import configStore from '../config';
import { app } from 'electron';
import path from 'node:path';

jest.mock('./post-backup');
jest.mock('../config');
jest.mock('node:path');

const mockPostBackup = jest.mocked(postBackup);
const mockConfigStore = jest.mocked(configStore);
const mockApp = jest.mocked(app);
const mockPath = jest.mocked(path);

describe('createBackup', () => {
  const mockDevice = {
    id: 1,
    uuid: 'device-123',
    bucket: 'test-bucket',
    name: 'Test Device',
    removed: false,
    hasBackups: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockPath.parse.mockReturnValue({
      root: '/',
      dir: '/home/user',
      base: 'TestFolder',
      ext: '',
      name: 'TestFolder',
    });

    mockApp.getPath.mockReturnValue('/tmp');
    mockConfigStore.get.mockReturnValue({});
  });

  it('should create backup successfully', async () => {
    mockPostBackup.mockResolvedValue({
      data: {
        id: 123,
        name: 'TestFolder',
        uuid: 'backup-uuid-456',
      },
    });

    const result = await createBackup({
      pathname: '/home/user/TestFolder',
      device: mockDevice,
    });

    expect(mockPostBackup).toBeCalledWith({
      folderName: 'TestFolder',
      device: mockDevice,
    });

    expect(mockConfigStore.set).toBeCalledWith('backupList', {
      '/home/user/TestFolder': {
        enabled: true,
        folderId: 123,
        folderUuid: 'backup-uuid-456',
      },
    });

    expect(result).toStrictEqual({
      folderUuid: 'backup-uuid-456',
      folderId: 123,
      pathname: '/home/user/TestFolder',
      name: 'TestFolder',
      tmpPath: '/tmp',
      backupsBucket: 'test-bucket',
    });
  });

  it('should return undefined when postBackup fails', async () => {
    mockPostBackup.mockResolvedValue({
      error: new Error('Failed to create backup folder') as any,
    });

    const result = await createBackup({
      pathname: '/home/user/FailedFolder',
      device: mockDevice,
    });

    expect(result).toBeUndefined();
    expect(mockConfigStore.set).not.toBeCalled();
  });
});
