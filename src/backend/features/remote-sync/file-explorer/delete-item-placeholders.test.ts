import { NodeWin } from '@/infra/node-win/node-win.module';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { deleteItemPlaceholders } from './delete-item-placeholders';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import VirtualDrive from '@/node-win/virtual-drive';
import { mockDeep } from 'vitest-mock-extended';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('delete-item-placeholders', () => {
  const getFolderUuid = partialSpyOn(NodeWin, 'getFolderUuid');
  const getFileUuid = partialSpyOn(NodeWin, 'getFileUuid');

  const virtualDrive = mockDeep<VirtualDrive>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call deleteFileSyncRoot if folder uuids match', () => {
    // Given
    getFolderUuid.mockReturnValue({ data: 'uuid' as FolderUuid });
    const props = mockProps<typeof deleteItemPlaceholders>({
      remotes: [{ path: createRelativePath('folder1', 'folder2'), uuid: 'uuid' }],
      isFolder: true,
      virtualDrive,
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
      isFolder: true,
      virtualDrive,
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
      isFolder: false,
      virtualDrive,
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
      isFolder: false,
      virtualDrive,
    });
    // When
    deleteItemPlaceholders(props);
    // Then
    expect(virtualDrive.deleteFileSyncRoot).toBeCalledTimes(0);
  });
});
