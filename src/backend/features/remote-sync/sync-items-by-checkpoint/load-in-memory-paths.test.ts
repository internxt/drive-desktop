import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loadInMemoryPaths } from './load-in-memory-paths';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as statReaddir from '@/infra/file-system/services/stat-readdir';

describe('load-in-memory-paths', () => {
  const statReaddirMock = partialSpyOn(statReaddir, 'statReaddir');
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');

  const props = mockProps<typeof loadInMemoryPaths>({ ctx: {} });

  it('should iterate through folders and retrieve all files and folders with uuid', async () => {
    // Given
    statReaddirMock
      .mockResolvedValueOnce({
        files: [{ path: abs('/file1') }, { path: abs('/file2') }],
        folders: [{ path: abs('/folder1') }, { path: abs('/folder2') }],
      })
      .mockResolvedValueOnce({
        files: [{ path: abs('/file3') }],
        folders: [],
      });

    getFolderInfoMock.mockResolvedValueOnce({ data: { uuid: 'folderUuid' as FolderUuid } }).mockResolvedValueOnce({});
    getFileInfoMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ data: { uuid: 'fileUuid2' as FileUuid } })
      .mockResolvedValueOnce({ data: { uuid: 'fileUuid3' as FileUuid } });
    // When
    const { files, folders } = await loadInMemoryPaths(props);
    // Then
    expect(folders).toStrictEqual(new Map([['folderUuid', { path: '/folder1' }]]));
    expect(files).toMatchObject(
      new Map([
        ['fileUuid2', { path: '/file2' }],
        ['fileUuid3', { path: '/file3' }],
      ]),
    );
  });
});
