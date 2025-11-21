import { mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { Traverser } from './traverser';
import { v4 } from 'uuid';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';

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
        { status: 'DELETED' },
      ],
    });

    getFoldersMock.mockResolvedValue({
      data: [
        { uuid: folder1, name: 'folder1', parentUuid: folder, status: 'EXISTS' },
        { uuid: folder2, name: 'folder2', parentUuid: folder, status: 'EXISTS' },
        { uuid: folder3, name: 'folder3', parentUuid: folder1, status: 'EXISTS' },
        { status: 'DELETED' },
      ],
    });
  });

  const traverser = new Traverser();
  let props: Parameters<typeof traverser.run>[0];

  beforeEach(() => {
    props = mockProps<typeof traverser.run>({
      context: {
        abortController: new AbortController(),
        folderId: 1,
        folderUuid: folder,
        pathname: abs('/backup'),
      },
    });
  });

  it('If signal is aborted then do not traverse', async () => {
    // Given
    props.context.abortController.abort();
    // When
    const res = await traverser.run(props);
    // Then
    expect(Object.keys(res.folders)).toStrictEqual(['/backup']);
    expect(Object.keys(res.files)).toStrictEqual([]);
  });

  it('It should add files and folders', async () => {
    // When
    const res = await traverser.run(props);

    // Then
    expect(Object.keys(res.folders)).toStrictEqual(['/backup', '/backup/folder1', '/backup/folder1/folder3', '/backup/folder2']);
    expect(Object.keys(res.files)).toStrictEqual([
      '/backup/file1',
      '/backup/file2',
      '/backup/folder1/file3',
      '/backup/folder1/folder3/file4',
    ]);
  });
});
