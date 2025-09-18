import fs from 'fs';
import { v4 } from 'uuid';

import { addon } from '@/node-win/addon';

import VirtualDrive from './virtual-drive';
import { iconPath } from '@/apps/utils/icon';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { INTERNXT_VERSION } from '@/core/utils/utils';

vi.mock(import('fs'));
vi.mock(import('@/node-win/addon'));

describe('VirtualDrive', () => {
  const existsSyncMock = vi.mocked(fs.existsSync);
  const addonMock = vi.mocked(addon);

  const rootPath = 'C:/Users/user/InternxtDrive';
  const loggerPath = 'C:/Users/user/InternxtDrive/logs';
  const providerId = v4();

  const props = { rootPath, loggerPath, providerId };
  const drive = new VirtualDrive(props);

  beforeEach(() => {
    addonMock.addLoggerPath.mockReturnValue(true);
    addonMock.createEntry.mockReturnValue({ success: true });
  });

  describe('When convertToWindowsPath is called', () => {
    it('When unix path, then convert to windows path', () => {
      // Then
      const result = drive.convertToWindowsPath({ path: 'C:/Users/user/InternxtDrive/test.txt' });
      expect(result).toBe('C:\\Users\\user\\InternxtDrive\\test.txt');
    });

    it('When windows path, then do not modify it', () => {
      // Then
      const result = drive.convertToWindowsPath({ path: 'C:\\Users\\user\\InternxtDrive\\test.txt' });
      expect(result).toBe('C:\\Users\\user\\InternxtDrive\\test.txt');
    });
  });

  describe('When fixPath is called', () => {
    it('When absolute windows path, then do not modify it', () => {
      // Then
      expect(drive.fixPath('C:\\Users\\user\\InternxtDrive\\test.txt')).toBe('C:\\Users\\user\\InternxtDrive\\test.txt');
    });

    it('When absolute unix path, then convert to absolute windows path', () => {
      // Then
      expect(drive.fixPath('C:/Users/user/InternxtDrive/test.txt')).toBe('C:\\Users\\user\\InternxtDrive\\test.txt');
    });

    it('When relative path, then convert to absolute windows path', () => {
      // Then
      expect(drive.fixPath('test.txt')).toBe('C:\\Users\\user\\InternxtDrive\\test.txt');
    });

    it('When relative windows path, then convert to absolute windows path', () => {
      // Then
      expect(drive.fixPath('\\test.txt')).toBe('C:\\Users\\user\\InternxtDrive\\test.txt');
    });

    it('When relative unix path, then convert to absolute windows path', () => {
      // Then
      expect(drive.fixPath('/test.txt')).toBe('C:\\Users\\user\\InternxtDrive\\test.txt');
    });
  });

  describe('When VirtualDrive is created', () => {
    it('When rootPath does not exist, then it creates it', () => {
      // Given
      existsSyncMock.mockReturnValue(false);
      // When
      new VirtualDrive(props);
      // Then
      expect(fs.mkdirSync).toBeCalledWith('C:\\Users\\user\\InternxtDrive', { recursive: true });
    });

    it('When rootPath exists, then it does not create it', () => {
      // Given
      existsSyncMock.mockReturnValue(true);
      // When
      new VirtualDrive(props);
      // Then
      expect(fs.mkdirSync).not.toBeCalled();
    });

    it('Then it calls addon.addLoggerPath with logPath provided', () => {
      // When
      new VirtualDrive(props);
      // Then
      expect(addon.addLoggerPath).toBeCalledWith('C:\\Users\\user\\InternxtDrive\\logs');
    });
  });

  describe('When call createFileByPath', () => {
    it('Then it calls addon.createPlaceholderFile', () => {
      // Given
      const creationTime = new Date('2000-01-01T00:00:00Z').getTime();
      const lastWriteTime = new Date('2000-01-02T00:00:00Z').getTime();
      const drive = new VirtualDrive(props);

      // When
      drive.createFileByPath({
        itemId: 'FILE:uuid',
        itemPath: createRelativePath('folder1', 'folder2', 'file.txt'),
        creationTime,
        lastWriteTime,
        size: 1024,
      });

      // Then
      expect(addon.createPlaceholderFile).toBeCalledWith(
        'file.txt',
        'FILE:uuid',
        1024,
        1,
        '125911584000000000',
        '125912448000000000',
        expect.any(String),
        'C:\\Users\\user\\InternxtDrive\\folder1\\folder2',
      );
    });
  });

  describe('When call createFolderByPath', () => {
    it('Then it calls addon.createEntry', () => {
      // Given
      const creationTime = new Date('2000-01-01T00:00:00Z').getTime();
      const lastWriteTime = new Date('2000-01-02T00:00:00Z').getTime();
      const drive = new VirtualDrive(props);

      // When
      drive.createFolderByPath({
        itemId: 'FOLDER:uuid',
        itemPath: createRelativePath('folder1', 'folder2'),
        creationTime,
        lastWriteTime,
      });

      // Then
      expect(addon.createEntry).toBeCalledWith(
        'folder2',
        'FOLDER:uuid',
        true,
        0,
        1,
        '125911584000000000',
        '125912448000000000',
        expect.any(String),
        'C:\\Users\\user\\InternxtDrive\\folder1',
      );
    });
  });

  describe('When call registerSyncRoot', () => {
    it('Then it assigns callbacks and calls addon.registerSyncRoot', () => {
      // Given
      const providerName = 'InternxtDrive';
      // When
      drive.registerSyncRoot({ providerName });
      // Then
      expect(addon.registerSyncRoot).toBeCalledWith('C:\\Users\\user\\InternxtDrive', providerName, INTERNXT_VERSION, providerId, iconPath);
    });
  });
});
