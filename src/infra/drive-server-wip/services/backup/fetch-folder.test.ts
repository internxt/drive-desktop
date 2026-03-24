import { clientMock } from 'tests/vitest/mocks.helper.test';
import { fetchFolder } from './fetch-folder';

describe('fetch-folder', () => {
  it('should return NOT_FOUND error when folder is not found', async () => {
    clientMock.GET.mockResolvedValue({ response: { status: 404, headers: new Map() } });
    const { error } = await fetchFolder({ folderUuid: 'uuid' });
    expect(error?.code).toStrictEqual('NOT_FOUND');
  });
});
