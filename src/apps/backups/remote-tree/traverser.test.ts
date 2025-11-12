import { mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { Traverser } from './traverser';
import { v4 } from 'uuid';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

vi.mock(import('@/apps/main/util'));

describe('traverser', () => {
  const getFilesMock = partialSpyOn(SqliteModule.FileModule, 'getByWorkspaceId');
  const getFoldersMock = partialSpyOn(SqliteModule.FolderModule, 'getByWorkspaceId');

  const folder = v4() as FolderUuid;

  const folder1 = v4() as FolderUuid;
  const folder2 = v4() as FolderUuid;
  const folder3 = v4() as FolderUuid;

  beforeEach(() => {
    getFilesMock.mockResolvedValue({
      data: [
        { nameWithExtension: 'file1', parentUuid: folder, status: 'EXISTS' },
        { nameWithExtension: 'file2', parentUuid: folder, status: 'EXISTS' },
        { nameWithExtension: 'file3', parentUuid: folder1, status: 'EXISTS' },
        { nameWithExtension: 'file4', parentUuid: folder3, status: 'EXISTS' },
      ],
    });

    getFoldersMock.mockResolvedValue({
      data: [
        { uuid: folder1, name: 'folder1', parentUuid: folder, status: 'EXISTS' },
        { uuid: folder2, name: 'folder2', parentUuid: folder, status: 'EXISTS' },
        { uuid: folder3, name: 'folder3', parentUuid: folder1, status: 'EXISTS' },
      ],
    });
  });

  const traverser = new Traverser();
  const props = mockProps<typeof traverser.run>({
    context: {
      abortController: { signal: { aborted: false } },
      folderId: 1,
      folderUuid: folder,
      pathname: 'C:/Users/user/Backup',
    },
  });

  it('If signal is aborted then do not traverse', async () => {
    // Given
    const props = mockProps<typeof traverser.run>({
      context: {
        abortController: { signal: { aborted: true } },
        folderId: 1,
        folderUuid: folder,
      },
    });

    // When
    const res = await traverser.run(props);

    // Then
    expect(Object.keys(res.folders)).toStrictEqual(['/']);
    expect(Object.keys(res.files)).toStrictEqual([]);
  });

  it('It should add files and folders', async () => {
    // When
    const res = await traverser.run(props);

    // Then
    expect(Object.keys(res.folders)).toStrictEqual(['/', '/folder1', '/folder1/folder3', '/folder2']);
    expect(Object.keys(res.files)).toStrictEqual(['/file1', '/file2', '/folder1/file3', '/folder1/folder3/file4']);
  });
});
