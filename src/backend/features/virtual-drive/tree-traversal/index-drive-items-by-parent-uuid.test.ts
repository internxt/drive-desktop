import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { indexDriveItemsByParentUuid } from './index-drive-items-by-parent-uuid';

describe('index-drive-items-by-parent-uuid', () => {
  it('should group files and folders by parent uuid while preserving order', () => {
    // Given
    const rootUuid = 'rootUuid' as FolderUuid;
    const childUuid = 'childUuid' as FolderUuid;
    const files = [
      { name: 'file1', parentUuid: rootUuid },
      { name: 'file2', parentUuid: childUuid },
      { name: 'file3', parentUuid: rootUuid },
      { name: 'orphan' },
    ] as SimpleDriveFile[];
    const folders = [
      { name: 'folder1', parentUuid: rootUuid },
      { name: 'folder2', parentUuid: childUuid },
      { name: 'folder3', parentUuid: rootUuid },
      { name: 'root' },
    ] as SimpleDriveFolder[];

    // When
    const { filesByParentUuid, foldersByParentUuid } = indexDriveItemsByParentUuid({ files, folders });

    // Then
    expect(filesByParentUuid.get(rootUuid)).toMatchObject([{ name: 'file1' }, { name: 'file3' }]);
    expect(filesByParentUuid.get(childUuid)).toMatchObject([{ name: 'file2' }]);
    expect(filesByParentUuid.get(undefined)).toMatchObject([{ name: 'orphan' }]);

    expect(foldersByParentUuid.get(rootUuid)).toMatchObject([{ name: 'folder1' }, { name: 'folder3' }]);
    expect(foldersByParentUuid.get(childUuid)).toMatchObject([{ name: 'folder2' }]);
    expect(foldersByParentUuid.get(undefined)).toMatchObject([{ name: 'root' }]);
  });
});
