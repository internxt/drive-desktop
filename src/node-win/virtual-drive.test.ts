import { v4 } from 'uuid';

import { addon } from '@/node-win/addon';

import { VirtualDrive } from './virtual-drive';
import { iconPath } from '@/apps/utils/icon';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { call } from '@/tests/vitest/utils.helper.test';

vi.mock(import('node:fs'));

describe('VirtualDrive', () => {
  const rootPath = 'C:/Users/user/InternxtDrive';
  const providerId = v4();

  const props = { rootPath, providerId };
  const drive = new VirtualDrive(props);

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

  describe('When call createFileByPath', () => {
    it('Then it calls addon.createFilePlaceholder', () => {
      // Given
      const creationTime = new Date('2000-01-01T00:00:00Z').getTime();
      const lastWriteTime = new Date('2000-01-02T00:00:00Z').getTime();
      const drive = new VirtualDrive(props);

      // When
      drive.createFileByPath({
        placeholderId: 'FILE:uuid',
        itemPath: createRelativePath('folder1', 'folder2', 'file.txt'),
        creationTime,
        lastWriteTime,
        size: 1024,
      });

      // Then
      call(addon.createFilePlaceholder).toStrictEqual([
        'file.txt',
        'FILE:uuid',
        1024,
        946684800000,
        946771200000,
        expect.any(Number),
        'C:\\Users\\user\\InternxtDrive\\folder1\\folder2',
      ]);
    });
  });

  describe('When call createFolderByPath', () => {
    it('Then it calls addon.createFolderPlaceholder', () => {
      // Given
      const creationTime = new Date('2000-01-01T00:00:00Z').getTime();
      const lastWriteTime = new Date('2000-01-02T00:00:00Z').getTime();
      const drive = new VirtualDrive(props);

      // When
      drive.createFolderByPath({
        placeholderId: 'FOLDER:uuid',
        itemPath: createRelativePath('folder1', 'folder2'),
        creationTime,
        lastWriteTime,
      });

      // Then
      call(addon.createFolderPlaceholder).toStrictEqual([
        'folder2',
        'FOLDER:uuid',
        946684800000,
        946771200000,
        expect.any(Number),
        'C:\\Users\\user\\InternxtDrive\\folder1',
      ]);
    });
  });

  describe('When call registerSyncRoot', () => {
    it('Then it assigns callbacks and calls addon.registerSyncRoot', () => {
      // Given
      const providerName = 'InternxtDrive';
      // When
      drive.registerSyncRoot({ providerName });
      // Then
      call(addon.registerSyncRoot).toStrictEqual(['C:\\Users\\user\\InternxtDrive', providerName, INTERNXT_VERSION, providerId, iconPath]);
    });
  });
});
