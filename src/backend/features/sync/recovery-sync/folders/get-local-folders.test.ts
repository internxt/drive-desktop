import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getLocalFolders } from './get-local-folders';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

describe('get-local-folders', () => {
  const getBetweenUuidsMock = partialSpyOn(SqliteModule.FolderModule, 'getBetweenUuids');

  let props: Parameters<typeof getLocalFolders>[0];

  beforeEach(() => {
    getBetweenUuidsMock.mockResolvedValue({ data: [{ uuid: 'uuid' as FolderUuid }] });

    props = mockProps<typeof getLocalFolders>({ remotes: [{ uuid: 'uuid' as FolderUuid }] });
  });

  it('should return if there are no remotes', async () => {
    // Given
    props.remotes = [];
    // When
    const res = await getLocalFolders(props);
    // Then
    expect(res).toBeUndefined();
  });

  it('should return if there is an error retrieving locals', async () => {
    // Given
    getBetweenUuidsMock.mockResolvedValue({ error: new Error() });
    // When
    const res = await getLocalFolders(props);
    // Then
    expect(res).toBeUndefined();
  });

  it('should return empty if locals is empty', async () => {
    // Given
    getBetweenUuidsMock.mockResolvedValue({ data: [] });
    // When
    const res = await getLocalFolders(props);
    // Then
    expect(res).toStrictEqual([]);
  });

  it('should return locals', async () => {
    // When
    const res = await getLocalFolders(props);
    // Then
    expect(res).toStrictEqual([{ uuid: 'uuid' }]);
  });
});
