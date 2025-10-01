import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getLocalFiles } from './get-local-files';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

describe('get-local-files', () => {
  const getBetweenIdsMock = partialSpyOn(SqliteModule.FileModule, 'getBetweenIds');

  let props: Parameters<typeof getLocalFiles>[0];

  beforeEach(() => {
    getBetweenIdsMock.mockResolvedValue({ data: [{ id: 1 }] });

    props = mockProps<typeof getLocalFiles>({ remotes: [{ id: 1 }] });
  });

  it('should return if there are no remotes', async () => {
    // Given
    props.remotes = [];
    // When
    const res = await getLocalFiles(props);
    // Then
    expect(res).toBeUndefined();
  });

  it('should return if there are is an error retrieving locals', async () => {
    // Given
    getBetweenIdsMock.mockResolvedValue({ error: new Error() });
    // When
    const res = await getLocalFiles(props);
    // Then
    expect(res).toBeUndefined();
  });

  it('should return empty if locals is empty', async () => {
    // Given
    getBetweenIdsMock.mockResolvedValue({ data: [] });
    // When
    const res = await getLocalFiles(props);
    // Then
    expect(res).toStrictEqual([]);
  });

  it('should return locals', async () => {
    // When
    const res = await getLocalFiles(props);
    // Then
    expect(res).toStrictEqual([{ id: 1 }]);
  });
});
