import fs from 'fs';
import { v4 } from 'uuid';
import { Mock } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import { addon } from '@/node-win/addon';

import { TLogger } from './logger';
import VirtualDrive from './virtual-drive';

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
  const loggerMock = mockDeep<TLogger>();

  const syncRootPath = 'C:\\test-drive';
  const loggerPath = 'C:\\test-logs';

  describe('When convertToWindowsPath is called', () => {
    const providerId = v4();

    // Arrange
    const drive = new VirtualDrive({ syncRootPath, providerId, loggerPath, logger: loggerMock });

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
    const providerId = v4();

    // Arrange
    const drive = new VirtualDrive({ syncRootPath, providerId, loggerPath, logger: loggerMock });

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

      const providerId = v4();

      // Act
      new VirtualDrive({ syncRootPath, providerId, loggerPath, logger: loggerMock });

      // Assert
      expect(fs.mkdirSync).toHaveBeenCalledWith(syncRootPath, {
        recursive: true,
      });
    });

    it('When syncRootPath exists, then it does not create it', () => {
      // Arrange
      mockExistsSync.mockReturnValue(true);

      const providerId = v4();

      // Act
      new VirtualDrive({ syncRootPath, providerId, loggerPath, logger: loggerMock });

      // Assert
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('Then it calls addon.addLoggerPath with logPath provided', () => {
      // Act
      const providerId = v4();

      new VirtualDrive({ syncRootPath, providerId, loggerPath, logger: loggerMock });

      // Assert
      expect(addon.addLoggerPath).toHaveBeenCalledWith(loggerPath);
    });
  });

  describe('When call createFileByPath', () => {
    it('Then it calls addon.createPlaceholderFile', () => {
      // Arrange
      mockExistsSync.mockReturnValue(true);
      const providerId = v4();

      const drive = new VirtualDrive({ syncRootPath, providerId, loggerPath, logger: loggerMock });

      // Act
      drive.createFileByPath({
        relativePath: 'folder/subfolder/file.txt',
        itemId: 'file-id',
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
      const providerId = v4();
      const drive = new VirtualDrive({ syncRootPath, providerId, loggerPath, logger: loggerMock });
      const providerName = 'MyProvider';
      const providerVersion = '1.0.0';
      const logoPath = 'C:\\iconPath';

      // Act
      drive.registerSyncRoot({ providerName, providerVersion, logoPath });

      // Assert
      expect(addon.registerSyncRoot).toHaveBeenCalledWith(syncRootPath, providerName, providerVersion, providerId, logoPath);
    });
  });
});
