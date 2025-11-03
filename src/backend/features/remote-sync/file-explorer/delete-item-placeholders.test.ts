import { NodeWin } from '@/infra/node-win/node-win.module';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { deleteItemPlaceholders } from './delete-item-placeholders';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { rm } from 'node:fs/promises';

vi.mock(import('node:fs/promises'));

describe('delete-item-placeholders', () => {
  const rmMock = vi.mocked(rm);

  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');

  describe('what should happen for folders', () => {
    const absolutePath = 'C:/Users/user/Internxt/folder1/folder2' as AbsolutePath;
    const props = mockProps<typeof deleteItemPlaceholders>({
      remotes: [{ absolutePath, uuid: 'uuid' as FolderUuid }],
      type: 'folder',
    });

    it('should call deleteFileSyncRoot if folder uuids match', async () => {
      // Given
      getFolderInfoMock.mockReturnValue({ data: { uuid: 'uuid' as FolderUuid } });
      // When
      await deleteItemPlaceholders(props);
      // Then
      expect(rmMock).toBeCalledWith(absolutePath, { recursive: true, force: true });
    });

    it('should not call deleteFileSyncRoot if folder uuids do not match', async () => {
      // Given
      getFolderInfoMock.mockReturnValue({ data: { uuid: 'different' as FolderUuid } });
      // When
      await deleteItemPlaceholders(props);
      // Then
      expect(rmMock).toBeCalledTimes(0);
    });
  });

  describe('what should happen for files', () => {
    const absolutePath = 'C:/Users/user/Internxt/folder/file.txt' as AbsolutePath;
    const props = mockProps<typeof deleteItemPlaceholders>({
      remotes: [{ absolutePath, uuid: 'uuid' as FileUuid }],
      type: 'file',
    });

    it('should call deleteFileSyncRoot if file uuids match', async () => {
      // Given
      getFileInfoMock.mockReturnValue({ data: { uuid: 'uuid' as FileUuid } });
      // When
      await deleteItemPlaceholders(props);
      // Then
      expect(rmMock).toBeCalledWith(absolutePath, { recursive: true, force: true });
    });

    it('should not call deleteFileSyncRoot if file uuids do not match', async () => {
      // Given
      getFileInfoMock.mockReturnValue({ data: { uuid: 'different' as FileUuid } });
      // When
      await deleteItemPlaceholders(props);
      // Then
      expect(rmMock).toBeCalledTimes(0);
    });
  });
});
