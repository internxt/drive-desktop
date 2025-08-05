import { deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loadInMemoryPaths } from './load-in-memory-paths';
import { readdir } from 'fs/promises';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { mockDeep } from 'vitest-mock-extended';
import VirtualDrive from '@/node-win/virtual-drive';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Dirent } from 'fs';

vi.mock(import('fs/promises'));

describe('load-in-memory-paths', () => {
  const readdirMock = deepMocked(readdir);
  const statMock = partialSpyOn(fileSystem, 'stat');
  const getFolderUuidMock = partialSpyOn(NodeWin, 'getFolderUuid');
  const getFileUuidMock = partialSpyOn(NodeWin, 'getFileUuid');

  const drive = mockDeep<VirtualDrive>({
    syncRootPath: 'C:\\Users\\user\\InternxtDrive' as AbsolutePath,
  });

  const props = mockProps<typeof loadInMemoryPaths>({ drive });

  it('should iterate through folders and retrieve all files and folders with uuid', async () => {
    // Given
    readdirMock.mockResolvedValueOnce(['folder', 'file1'] as unknown as Dirent<Buffer>[]);
    readdirMock.mockResolvedValueOnce(['file2'] as unknown as Dirent<Buffer>[]);
    statMock.mockResolvedValueOnce({ data: { isDirectory: () => true, isFile: () => false } });
    statMock.mockResolvedValueOnce({ data: { isDirectory: () => false, isFile: () => true } });
    statMock.mockResolvedValueOnce({ data: { isDirectory: () => false, isFile: () => true } });
    getFolderUuidMock.mockReturnValueOnce({ data: 'folderUuid' as FolderUuid });
    getFileUuidMock.mockReturnValueOnce({});
    getFileUuidMock.mockReturnValueOnce({ data: 'fileUuid2' as FileUuid });
    // When
    const { files, folders } = await loadInMemoryPaths(props);
    // Then
    expect(Object.keys(files)).toContain('fileUuid2');
    expect(files['fileUuid2' as FileUuid].path).toBe('C:\\Users\\user\\InternxtDrive\\folder\\file2');
    expect(files['fileUuid2' as FileUuid].stats).toBeDefined();
    expect(folders).toStrictEqual({ folderUuid: 'C:\\Users\\user\\InternxtDrive\\folder' });
  });
});
