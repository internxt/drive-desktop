import { NodeWin } from '@/infra/node-win/node-win.module';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { deleteItemPlaceholders } from './delete-item-placeholders';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import VirtualDrive from '@/node-win/virtual-drive';
import { mockDeep } from 'vitest-mock-extended';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { initializeVirtualDrive } from '@/apps/sync-engine/dependency-injection/common/virtualDrive';

describe('delete-item-placeholders', () => {
  const virtualDrive = mockDeep<VirtualDrive>();
  initializeVirtualDrive(virtualDrive);

  const getFolderUuid = partialSpyOn(NodeWin, 'getFolderUuid');
  const getFileUuid = partialSpyOn(NodeWin, 'getFileUuid');

  it('should call deleteFileSyncRoot if folder uuids match', () => {
    // Given
    getFolderUuid.mockReturnValue({ data: 'uuid' as FolderUuid });
    const props = mockProps<typeof deleteItemPlaceholders>({
      remotes: [{ path: createRelativePath('folder1', 'folder2'), uuid: 'uuid' }],
      type: 'folder',
    });
    // When
    deleteItemPlaceholders(props);
    // Then
    expect(virtualDrive.deleteFileSyncRoot).toBeCalledWith({ path: '/folder1/folder2' });
  });

  it('should not call deleteFileSyncRoot if folder uuids do not match', () => {
    // Given
    getFolderUuid.mockReturnValue({ data: 'uuid' as FolderUuid });
    const props = mockProps<typeof deleteItemPlaceholders>({
      remotes: [{ path: createRelativePath('folder1', 'folder2'), uuid: 'different' }],
      type: 'folder',
    });
    // When
    deleteItemPlaceholders(props);
    // Then
    expect(virtualDrive.deleteFileSyncRoot).toBeCalledTimes(0);
  });

  it('should call deleteFileSyncRoot if file uuids match', () => {
    // Given
    getFileUuid.mockReturnValue({ data: 'uuid' as FileUuid });
    const props = mockProps<typeof deleteItemPlaceholders>({
      remotes: [{ path: createRelativePath('folder', 'file.txt'), uuid: 'uuid' }],
      type: 'file',
    });
    // When
    deleteItemPlaceholders(props);
    // Then
    expect(virtualDrive.deleteFileSyncRoot).toBeCalledWith({ path: '/folder/file.txt' });
  });

  it('should not call deleteFileSyncRoot if file uuids do not match', () => {
    // Given
    getFileUuid.mockReturnValue({ data: 'uuid' as FileUuid });
    const props = mockProps<typeof deleteItemPlaceholders>({
      remotes: [{ path: createRelativePath('folder', 'file.txt'), uuid: 'different' }],
      type: 'file',
    });
    // When
    deleteItemPlaceholders(props);
    // Then
    expect(virtualDrive.deleteFileSyncRoot).toBeCalledTimes(0);
  });
});
