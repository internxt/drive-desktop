import { NodeWin } from '@/infra/node-win/node-win.module';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { deleteItemPlaceholders } from './delete-item-placeholders';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import VirtualDrive from '@/node-win/virtual-drive';
import { mockDeep } from 'vitest-mock-extended';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('delete-item-placeholders', () => {
  const virtualDrive = mockDeep<VirtualDrive>();

  const getFolderUuid = partialSpyOn(NodeWin, 'getFolderUuid');
  const getFileUuid = partialSpyOn(NodeWin, 'getFileUuid');

  describe('what should happen for folders', () => {
    const props = mockProps<typeof deleteItemPlaceholders>({
      remotes: [{ path: createRelativePath('folder1', 'folder2'), uuid: 'uuid' as FolderUuid }],
      type: 'folder',
      ctx: { virtualDrive },
    });

    it('should call deleteFileSyncRoot if folder uuids match', () => {
      // Given
      getFolderUuid.mockReturnValue({ data: 'uuid' as FolderUuid });
      // When
      deleteItemPlaceholders(props);
      // Then
      expect(virtualDrive.deleteFileSyncRoot).toBeCalledWith({ path: '/folder1/folder2' });
    });

    it('should not call deleteFileSyncRoot if folder uuids do not match', () => {
      // Given
      getFolderUuid.mockReturnValue({ data: 'uuid' as FolderUuid });
      // When
      deleteItemPlaceholders(props);
      // Then
      expect(virtualDrive.deleteFileSyncRoot).toBeCalledTimes(0);
    });
  });

  describe('what should happen for files', () => {
    const props = mockProps<typeof deleteItemPlaceholders>({
      remotes: [{ path: createRelativePath('folder', 'file.txt'), uuid: 'uuid' as FileUuid }],
      type: 'file',
      ctx: { virtualDrive },
    });

    it('should call deleteFileSyncRoot if file uuids match', () => {
      // Given
      getFileUuid.mockReturnValue({ data: 'uuid' as FileUuid });
      // When
      deleteItemPlaceholders(props);
      // Then
      expect(virtualDrive.deleteFileSyncRoot).toBeCalledWith({ path: '/folder/file.txt' });
    });

    it('should not call deleteFileSyncRoot if file uuids do not match', () => {
      // Given
      getFileUuid.mockReturnValue({ data: 'uuid' as FileUuid });
      // When
      deleteItemPlaceholders(props);
      // Then
      expect(virtualDrive.deleteFileSyncRoot).toBeCalledTimes(0);
    });
  });
});
