import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { updateOnlyInItems } from './update-only-in-items';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as isItemNewer from './is-item-newer';
import * as createOrUpdateFile from '../../update-in-sqlite/create-or-update-file';
import * as createOrUpdateFolder from '../../update-in-sqlite/create-or-update-folder';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

describe('update-only-in-items', () => {
  const getFileByUuidMock = partialSpyOn(driveServerWip.files, 'getByUuid');
  const getFolderByUuidMock = partialSpyOn(driveServerWip.folders, 'getByUuid');
  const isItemNewerMock = partialSpyOn(isItemNewer, 'isItemNewer');
  const createOrUpdateFileMock = partialSpyOn(createOrUpdateFile, 'createOrUpdateFile');
  const createOrUpdateFolderMock = partialSpyOn(createOrUpdateFolder, 'createOrUpdateFolder');

  describe('when item is a file', () => {
    const props = mockProps<typeof updateOnlyInItems>({ type: 'file', item: { uuid: 'uuid' as FileUuid } });

    beforeEach(() => {
      getFileByUuidMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    });

    it('should not create or update if item is newer', async () => {
      // Given
      isItemNewerMock.mockReturnValue(true);
      // When
      await updateOnlyInItems(props);
      // Then
      expect(createOrUpdateFileMock).toBeCalledTimes(0);
    });

    it('should create or update if item is not newer', async () => {
      // Given
      isItemNewerMock.mockReturnValue(false);
      // When
      await updateOnlyInItems(props);
      // Then
      expect(createOrUpdateFileMock).toBeCalledTimes(1);
    });
  });

  describe('when item is a folder', () => {
    const props = mockProps<typeof updateOnlyInItems>({ type: 'folder', item: { uuid: 'folder' as FolderUuid } });

    beforeEach(() => {
      getFolderByUuidMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
    });

    it('should not create or update if item is newer', async () => {
      // Given
      isItemNewerMock.mockReturnValue(true);
      // When
      await updateOnlyInItems(props);
      // Then
      expect(createOrUpdateFolderMock).toBeCalledTimes(0);
    });

    it('should create or update if item is not newer', async () => {
      // Given
      isItemNewerMock.mockReturnValue(false);
      // When
      await updateOnlyInItems(props);
      // Then
      expect(createOrUpdateFolderMock).toBeCalledTimes(1);
    });
  });
});
