import { NodeWin } from '@/infra/node-win/node-win.module';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { deleteItemPlaceholders } from './delete-item-placeholders';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import VirtualDrive from '@/node-win/virtual-drive';
import { mockDeep } from 'vitest-mock-extended';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { rm } from 'fs/promises';

vi.mock(import('fs/promises'));

describe('delete-item-placeholders', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  const rmMock = vi.mocked(rm);

  const getFolderUuid = partialSpyOn(NodeWin, 'getFolderUuid');
  const getFileUuid = partialSpyOn(NodeWin, 'getFileUuid');

  describe('what should happen for folders', () => {
    const absolutePath = 'C:/Users/user/Internxt/folder1/folder2' as AbsolutePath;
    const props = mockProps<typeof deleteItemPlaceholders>({
      remotes: [{ absolutePath, uuid: 'uuid' as FolderUuid }],
      type: 'folder',
      ctx: { virtualDrive },
    });

    it('should call deleteFileSyncRoot if folder uuids match', async () => {
      // Given
      getFolderUuid.mockReturnValue({ data: 'uuid' as FolderUuid });
      // When
      await deleteItemPlaceholders(props);
      // Then
      expect(rmMock).toBeCalledWith(absolutePath, { recursive: true, force: true });
    });

    it('should not call deleteFileSyncRoot if folder uuids do not match', async () => {
      // Given
      getFolderUuid.mockReturnValue({ data: 'different' as FolderUuid });
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
      ctx: { virtualDrive },
    });

    it('should call deleteFileSyncRoot if file uuids match', async () => {
      // Given
      getFileUuid.mockReturnValue({ data: 'uuid' as FileUuid });
      // When
      await deleteItemPlaceholders(props);
      // Then
      expect(rmMock).toBeCalledWith(absolutePath, { recursive: true, force: true });
    });

    it('should not call deleteFileSyncRoot if file uuids do not match', async () => {
      // Given
      getFileUuid.mockReturnValue({ data: 'different' as FileUuid });
      // When
      await deleteItemPlaceholders(props);
      // Then
      expect(rmMock).toBeCalledTimes(0);
    });
  });
});
