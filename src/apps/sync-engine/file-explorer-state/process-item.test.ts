/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { processItem } from './process-item';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { PinState } from '@/node-win/types/placeholder.type';
import * as isModified from './is-modified';
import * as isHydrationPending from './is-hydration-pending';
import { GetFolderInfoError } from '@/infra/node-win/services/item-identity/get-folder-info';
import { GetFileInfoError } from '@/infra/node-win/services/item-identity/get-file-info';

describe('process-item', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const absoluteToRelativeMock = partialSpyOn(pathUtils, 'absoluteToRelative');
  const isModifiedMock = partialSpyOn(isModified, 'isModified');
  const isHydrationPendingMock = partialSpyOn(isHydrationPending, 'isHydrationPending');

  let props: Parameters<typeof processItem>[0];

  beforeEach(() => {
    absoluteToRelativeMock.mockReturnValue('/item' as RelativePath);

    props = mockProps<typeof processItem>({
      ctx: { virtualDrive: {} },
      localItem: { stats: { isDirectory: () => false, isFile: () => false } },
      state: { createFolders: [], createFiles: [], modifiedFiles: [], hydrateFiles: [] },
    });
  });

  describe('for folders', () => {
    beforeEach(() => {
      props.localItem.stats!.isDirectory = () => true;
    });

    it('should be added to create folders if not exists', () => {
      // Given
      getFolderInfoMock.mockReturnValue({ error: new GetFolderInfoError('NON_EXISTS') });
      // When
      processItem(props);
      // Then
      expect(props.state).toStrictEqual({
        createFolders: [expect.objectContaining({ path: '/item' })],
        createFiles: [],
        modifiedFiles: [],
        hydrateFiles: [],
      });
    });

    it('should not be added to create folders if exists', () => {
      // Given
      getFolderInfoMock.mockReturnValue({ data: { uuid: 'uuid' as FolderUuid } });
      // When
      processItem(props);
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
      getFileInfoMock.mockReturnValue({ data: { uuid: 'uuid' as FileUuid, pinState: PinState.AlwaysLocal } });
    });

    it('should be added to create files if not exists', () => {
      // Given
      getFileInfoMock.mockReturnValue({ error: new GetFileInfoError('NON_EXISTS') });
      // When
      processItem(props);
      // Then
      expect(props.state).toStrictEqual({
        createFolders: [],
        createFiles: [expect.objectContaining({ path: '/item' })],
        modifiedFiles: [],
        hydrateFiles: [],
      });
    });

    it('should be added to modified files if modified', () => {
      // Given
      isModifiedMock.mockReturnValue(true);
      // When
      processItem(props);
      // Then
      expect(props.state).toStrictEqual({
        createFolders: [],
        createFiles: [],
        modifiedFiles: [expect.objectContaining({ path: '/item' })],
        hydrateFiles: [],
      });
    });

    it('should be added to hydrate files if hydration is pending', () => {
      // Given
      isHydrationPendingMock.mockReturnValue(true);
      // When
      processItem(props);
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
