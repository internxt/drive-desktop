/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { processItem } from './process-item';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { PinState } from '@/node-win/types/placeholder.type';
import * as isModified from './is-modified';
import * as isHydrationPending from './is-hydration-pending';
import { GetFolderInfoError } from '@/infra/node-win/services/item-identity/get-folder-info';
import { GetFileInfoError } from '@/infra/node-win/services/item-identity/get-file-info';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';

describe('process-item', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const isModifiedMock = partialSpyOn(isModified, 'isModified');
  const isHydrationPendingMock = partialSpyOn(isHydrationPending, 'isHydrationPending');

  let props: Parameters<typeof processItem>[0];

  beforeEach(() => {
    props = mockProps<typeof processItem>({
      localItem: { path: abs('/item'), stats: { isDirectory: () => false, isFile: () => false } },
      state: { createFolders: [], createFiles: [], modifiedFiles: [], hydrateFiles: [] },
    });
  });

  describe('for folders', () => {
    beforeEach(() => {
      props.localItem.stats!.isDirectory = () => true;
    });

    it('should be added to create folders if not exists', async () => {
      // Given
      getFolderInfoMock.mockResolvedValue({ error: new GetFolderInfoError('NOT_A_PLACEHOLDER') });
      // When
      await processItem(props);
      // Then
      expect(props.state).toStrictEqual({
        createFolders: [expect.objectContaining({ path: '/item' })],
        createFiles: [],
        modifiedFiles: [],
        hydrateFiles: [],
      });
    });

    it('should not be added to create folders if exists', async () => {
      // Given
      getFolderInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
      // When
      await processItem(props);
      // Then
      expect(props.state).toStrictEqual({
        createFolders: [],
        createFiles: [],
        modifiedFiles: [],
        hydrateFiles: [],
      });
    });
  });

  describe('for files', () => {
    beforeEach(() => {
      props.localItem.stats!.isFile = () => true;
      getFileInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid, pinState: PinState.AlwaysLocal } });
    });

    it('should be added to create files if not exists', async () => {
      // Given
      getFileInfoMock.mockResolvedValue({ error: new GetFileInfoError('NOT_A_PLACEHOLDER') });
      // When
      await processItem(props);
      // Then
      expect(props.state).toStrictEqual({
        createFolders: [],
        createFiles: [expect.objectContaining({ path: '/item' })],
        modifiedFiles: [],
        hydrateFiles: [],
      });
    });

    it('should be added to modified files if modified', async () => {
      // Given
      isModifiedMock.mockReturnValue(true);
      // When
      await processItem(props);
      // Then
      expect(props.state).toStrictEqual({
        createFolders: [],
        createFiles: [],
        modifiedFiles: [expect.objectContaining({ path: '/item' })],
        hydrateFiles: [],
      });
    });

    it('should be added to hydrate files if hydration is pending', async () => {
      // Given
      isHydrationPendingMock.mockReturnValue(true);
      // When
      await processItem(props);
      // Then
      expect(props.state).toStrictEqual({
        createFolders: [],
        createFiles: [],
        modifiedFiles: [],
        hydrateFiles: [expect.objectContaining({ path: '/item' })],
      });
    });
  });
});
