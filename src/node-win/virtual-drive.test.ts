import { v4 } from 'uuid';

import { addon } from '@/node-win/addon';

import { VirtualDrive } from './virtual-drive';
import { iconPath } from '@/apps/utils/icon';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { call } from '@/tests/vitest/utils.helper.test';

vi.mock(import('node:fs'));
vi.mock(import('@/node-win/addon'));

describe('VirtualDrive', () => {
  const rootPath = abs('C:/Users/user/InternxtDrive');
  const providerId = v4();

  const props = { rootPath, providerId };
  const drive = new VirtualDrive(props);

  describe('When call createFileByPath', () => {
    it('Then it calls addon.createFilePlaceholder', () => {
      // Given
      const creationTime = new Date('2000-01-01T00:00:00Z').getTime();
      const lastWriteTime = new Date('2000-01-02T00:00:00Z').getTime();
      const drive = new VirtualDrive(props);

      // When
      drive.createFileByPath({
        placeholderId: 'FILE:uuid',
        path: abs('/parent/file.txt'),
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
        String.raw`\parent`,
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
        path: abs('/parent/folder'),
        creationTime,
        lastWriteTime,
      });

      // Then
      call(addon.createFolderPlaceholder).toStrictEqual([
        'folder',
        'FOLDER:uuid',
        946684800000,
        946771200000,
        expect.any(Number),
        String.raw`\parent`,
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
