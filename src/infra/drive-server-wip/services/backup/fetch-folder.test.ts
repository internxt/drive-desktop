import { clientMock } from 'tests/vitest/mocks.helper.test';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { fetchFolder } from './fetch-folder';

describe('fetch-folder', () => {
  const props = mockProps<typeof fetchFolder>({});

  it('should return NOT_FOUND error when folder is not found', async () => {
    // Given
    clientMock.GET.mockResolvedValue({ response: { status: 404, headers: new Map() } });
    // When
    const { error } = await fetchFolder(props);
    // Then
    expect(error?.code).toStrictEqual('NOT_FOUND');
  });
});
