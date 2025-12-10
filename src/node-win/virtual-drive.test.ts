import { v4 } from 'uuid';

import { addon } from '@/node-win/addon';

import { iconPath } from '@/apps/utils/icon';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { call } from '@/tests/vitest/utils.helper.test';
import { Addon } from './addon-wrapper';

vi.mock(import('node:fs'));
vi.mock(import('@/node-win/addon'));

describe('VirtualDrive', () => {
  describe('When call createFileByPath', () => {
    it('Then it calls addon.createFilePlaceholder', async () => {
      // Given
      const creationTime = new Date('2000-01-01T00:00:00Z').getTime();
      const lastWriteTime = new Date('2000-01-02T00:00:00Z').getTime();

      // When
      await Addon.createFilePlaceholder({
        placeholderId: 'FILE:uuid',
        path: abs('/parent/file.txt'),
        creationTime,
        lastWriteTime,
        size: 1024,
      });

      // Then
      call(addon.createFilePlaceholder).toStrictEqual([String.raw`\parent\file.txt`, 'FILE:uuid', 1024, 946684800000, 946771200000]);
    });
  });

  describe('When call createFolderByPath', () => {
    it('Then it calls addon.createFolderPlaceholder', async () => {
      // Given
      const creationTime = new Date('2000-01-01T00:00:00Z').getTime();
      const lastWriteTime = new Date('2000-01-02T00:00:00Z').getTime();

      // When
      await Addon.createFolderPlaceholder({
        placeholderId: 'FOLDER:uuid',
        path: abs('/parent/folder'),
        creationTime,
        lastWriteTime,
      });

      // Then
      call(addon.createFolderPlaceholder).toStrictEqual([String.raw`\parent\folder`, 'FOLDER:uuid', 946684800000, 946771200000]);
    });
  });

  describe('When call registerSyncRoot', () => {
    it('Then it assigns callbacks and calls addon.registerSyncRoot', () => {
      // Given
      const rootPath = abs('C:/Users/user/InternxtDrive');
      const providerId = v4();
      const providerName = 'InternxtDrive';
      // When
      Addon.registerSyncRoot({ rootPath, providerId, providerName });
      // Then
      call(addon.registerSyncRoot).toStrictEqual([
        String.raw`C:\Users\user\InternxtDrive`,
        providerName,
        INTERNXT_VERSION,
        providerId,
        iconPath,
      ]);
    });
  });
});
