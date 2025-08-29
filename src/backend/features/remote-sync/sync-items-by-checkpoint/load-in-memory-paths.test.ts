import { deepMocked, partialSpyOn } from '@/tests/vitest/utils.helper.test';
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
import { initializeVirtualDrive } from '@/apps/sync-engine/dependency-injection/common/virtualDrive';

vi.mock(import('fs/promises'));

describe('load-in-memory-paths', () => {
  const drive = mockDeep<VirtualDrive>({ syncRootPath: 'C:\\Users\\user\\InternxtDrive' as AbsolutePath });
  initializeVirtualDrive(drive);

  const readdirMock = deepMocked(readdir);
  const statMock = partialSpyOn(fileSystem, 'stat');
  const getFolderUuidMock = partialSpyOn(NodeWin, 'getFolderUuid');
  const getFileUuidMock = partialSpyOn(NodeWin, 'getFileUuid');

  it('should iterate through folders and retrieve all files and folders with uuid', async () => {
    // Given
    readdirMock.mockResolvedValueOnce(['folder', 'file1', 'folder/file2'] as unknown as Dirent<Buffer>[]);
    statMock.mockResolvedValueOnce({ data: { isDirectory: () => true, isFile: () => false } });
    statMock.mockResolvedValueOnce({ data: { isDirectory: () => false, isFile: () => true } });
    statMock.mockResolvedValueOnce({ data: { isDirectory: () => false, isFile: () => true } });
    getFolderUuidMock.mockReturnValueOnce({ data: 'folderUuid' as FolderUuid });
    getFileUuidMock.mockReturnValueOnce({});
    getFileUuidMock.mockReturnValueOnce({ data: 'fileUuid2' as FileUuid });
    // When
    const { files, folders } = await loadInMemoryPaths();
    // Then
    expect(folders).toStrictEqual({ folderUuid: 'C:\\Users\\user\\InternxtDrive\\folder' });
    expect(files).toStrictEqual({ fileUuid2: expect.objectContaining({ absolutePath: 'C:\\Users\\user\\InternxtDrive\\folder\\file2' }) });
  });
});
