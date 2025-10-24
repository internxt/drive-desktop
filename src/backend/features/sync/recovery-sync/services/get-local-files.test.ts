import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getLocalFiles } from './get-local-files';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('get-local-files', () => {
  const getBetweenUuidsMock = partialSpyOn(SqliteModule.FileModule, 'getBetweenUuids');

  let props: Parameters<typeof getLocalFiles>[0];

  beforeEach(() => {
    getBetweenUuidsMock.mockResolvedValue({ data: [{ uuid: 'uuid' as FileUuid }] });

    props = mockProps<typeof getLocalFiles>({ remotes: [{ uuid: 'uuid' as FileUuid }] });
  });

  it('should return if there are no remotes', async () => {
    // Given
    props.remotes = [];
    // When
    const res = await getLocalFiles(props);
    // Then
    expect(res).toBeUndefined();
  });

  it('should return if there is an error retrieving locals', async () => {
    // Given
    getBetweenUuidsMock.mockResolvedValue({ error: new Error() });
    // When
    const res = await getLocalFiles(props);
    // Then
    expect(res).toBeUndefined();
  });

  it('should return empty if locals is empty', async () => {
    // Given
    getBetweenUuidsMock.mockResolvedValue({ data: [] });
    // When
    const res = await getLocalFiles(props);
    // Then
    expect(res).toStrictEqual([]);
  });

  it('should return locals', async () => {
    // When
    const res = await getLocalFiles(props);
    // Then
    expect(res).toStrictEqual([{ uuid: 'uuid' }]);
  });
});
