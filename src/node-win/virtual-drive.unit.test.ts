import fs from 'fs';
import { v4 } from 'uuid';
import { Mock } from 'vitest';

import { addon } from '@/node-win/addon';

import VirtualDrive from './virtual-drive';
import { setDefaultConfig } from '@/apps/sync-engine/config';
import { iconPath } from '@/apps/utils/icon';

vi.mock(import('fs'));
vi.mock('@/node-win/addon', () => ({
  addon: {
    addLoggerPath: vi.fn().mockReturnValue(true),
    connectSyncRoot: vi.fn(),
    createPlaceholderFile: vi.fn(),
    registerSyncRoot: vi.fn().mockReturnValue(0),
  },
}));

describe('VirtualDrive', () => {
  const mockExistsSync = fs.existsSync as Mock;

  const syncRootPath = 'C:\\test-drive';
  const loggerPath = 'C:\\test-logs';
  const providerId = v4();

  setDefaultConfig({ rootPath: syncRootPath, loggerPath, providerId });

  describe('When convertToWindowsPath is called', () => {
    // Arrange
    const drive = new VirtualDrive();

    it('When unix path, then convert to windows path', () => {
      // Assert
      const result = drive.convertToWindowsPath({ path: 'C:/test-drive/test.txt' });
      expect(result).toBe('C:\\test-drive\\test.txt');
    });

    it('When windows path, then do not modify it', () => {
      // Assert
      const result = drive.convertToWindowsPath({ path: 'C:\\test-drive\\test.txt' });
      expect(result).toBe('C:\\test-drive\\test.txt');
    });
  });

  describe('When fixPath is called', () => {
    // Arrange
    const drive = new VirtualDrive();

    it('When absolute windows path, then do not modify it', () => {
      // Assert
      expect(drive.fixPath('C:\\test-drive\\test.txt')).toBe('C:\\test-drive\\test.txt');
    });

    it('When absolute unix path, then convert to absolute windows path', () => {
      // Assert
      expect(drive.fixPath('C:/test-drive/test.txt')).toBe('C:\\test-drive\\test.txt');
    });

    it('When relative path, then convert to absolute windows path', () => {
      // Assert
      expect(drive.fixPath('test.txt')).toBe('C:\\test-drive\\test.txt');
    });

    it('When relative windows path, then convert to absolute windows path', () => {
      // Assert
      expect(drive.fixPath('\\test.txt')).toBe('C:\\test-drive\\test.txt');
    });

    it('When relative unix path, then convert to absolute windows path', () => {
      // Assert
      expect(drive.fixPath('/test.txt')).toBe('C:\\test-drive\\test.txt');
    });
  });

  describe('When VirtualDrive is created', () => {
    it('When syncRootPath does not exist, then it creates it', () => {
      // Arrange
      mockExistsSync.mockReturnValue(false);
      // Act
      new VirtualDrive();
      // Assert
      expect(fs.mkdirSync).toHaveBeenCalledWith(syncRootPath, {
        recursive: true,
      });
    });

    it('When syncRootPath exists, then it does not create it', () => {
      // Arrange
      mockExistsSync.mockReturnValue(true);
      // Act
      new VirtualDrive();
      // Assert
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('Then it calls addon.addLoggerPath with logPath provided', () => {
      // Act
      new VirtualDrive();
      // Assert
      expect(addon.addLoggerPath).toHaveBeenCalledWith(loggerPath);
    });
  });

  describe('When call createFileByPath', () => {
    it('Then it calls addon.createPlaceholderFile', () => {
      // Arrange
      mockExistsSync.mockReturnValue(true);
      const drive = new VirtualDrive();

      // Act
      drive.createFileByPath({
        relativePath: 'folder/subfolder/file.txt',
        itemId: 'FILE:uuid',
        size: 1234,
        creationTime: 1660000000000,
        lastWriteTime: 1660000001000,
      });

      // Assert
      expect(addon.createPlaceholderFile).toHaveBeenCalledWith(
        'file.txt',
        'file-id',
        1234,
        1,
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.stringContaining('C:\\test-drive\\folder\\subfolder'),
      );
    });
  });

  describe('When call registerSyncRoot', () => {
    it('Then it assigns callbacks and calls addon.registerSyncRoot', () => {
      // Arrange
      const drive = new VirtualDrive();
      const providerName = 'MyProvider';
      const providerVersion = '1.0.0';

      // Act
      drive.registerSyncRoot({ providerName, providerVersion });

      // Assert
      expect(addon.registerSyncRoot).toHaveBeenCalledWith(syncRootPath, providerName, providerVersion, providerId, iconPath);
    });
  });
});
