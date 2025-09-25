/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { processItem } from './process-item';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { GetFolderIdentityError } from '@/infra/node-win/services/item-identity/get-folder-identity';
import { pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { GetFileIdentityError } from '@/infra/node-win/services/item-identity/get-file-identity';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { PinState } from '@/node-win/types/placeholder.type';
import * as isModified from './is-modified';
import * as isHydrationPending from './is-hydration-pending';

describe('process-item', () => {
  const getFolderUuidMock = partialSpyOn(NodeWin, 'getFolderUuid');
  const getFileUuidMock = partialSpyOn(NodeWin, 'getFileUuid');
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
      getFolderUuidMock.mockReturnValue({ error: new GetFolderIdentityError('NON_EXISTS') });
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
      getFolderUuidMock.mockReturnValue({ data: 'uuid' as FolderUuid });
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
      props.ctx.virtualDrive.getPlaceholderState = () => ({ pinState: PinState.AlwaysLocal });
      getFileUuidMock.mockReturnValue({ data: 'uuid' as FileUuid });
    });

    it('should be added to create files if not exists', () => {
      // Given
      getFileUuidMock.mockReturnValue({ error: new GetFileIdentityError('NON_EXISTS') });
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
