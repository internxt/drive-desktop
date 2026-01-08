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
        { name: 'file1', parentUuid: folder, status: 'EXISTS' },
        { name: 'file2', parentUuid: folder, status: 'EXISTS' },
        { name: 'file3', parentUuid: folder1, status: 'EXISTS' },
        { name: 'file4', parentUuid: folder3, status: 'EXISTS' },
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

  let props: Parameters<typeof Traverser.run>[0];

  beforeEach(() => {
    props = mockProps<typeof Traverser.run>({
      rootUuid: folder,
      rootPath: abs('/backup'),
    });
  });

  it('It should add files and folders', async () => {
    // When
    const res = await Traverser.run(props);

    // Then
    expect([...res.folders.keys()]).toStrictEqual(['/backup', '/backup/folder1', '/backup/folder1/folder3', '/backup/folder2']);
    expect([...res.files.keys()]).toStrictEqual([
      '/backup/file1',
      '/backup/file2',
      '/backup/folder1/file3',
      '/backup/folder1/folder3/file4',
    ]);
  });
});
