import { clientMock } from 'tests/vitest/mocks.helper.test';
import { fetchFolder } from './fetch-folder';

describe('fetch-folder', () => {
  it('should return data when folder exists', async () => {
    const mockData = {
      uuid: 'folder-uuid',
      removed: false,
      children: [{ id: 1, name: 'backup' }],
    };

    clientMock.GET.mockResolvedValue({ data: mockData });

    const { data, error } = await fetchFolder({ folderUuid: 'folder-uuid' });

    expect(error).toBeUndefined();
    expect(data).toEqual(mockData);
  });

  it('should return error when folder is not found (404)', async () => {
    clientMock.GET.mockResolvedValue({ response: { status: 404 } });

    const { data, error } = await fetchFolder({ folderUuid: 'nonexistent-folder' });

    expect(data).toBeUndefined();
    expect(error).toBeDefined();
    expect(error?.response?.status).toBe(404);
  });
});
