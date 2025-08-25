// tests/create-file.test.ts
import { clientMock } from 'tests/vitest/mocks.helper.test';
import { createFile } from './create-file';
import { mockProps } from '@/tests/vitest/utils.helper.test';

describe('create-file', () => {
  const props = mockProps({});
  it('should return data when file is created', async () => {
    const mockData = {
      uuid: 'file-uuid',
      name: 'example.txt',
      size: 1234,
    };

    clientMock.POST.mockResolvedValue({ data: mockData });

    const { data, error } = await createFile(props);

    expect(error).toBeUndefined();
    expect(data).toEqual(mockData);
  });

  it('should return FOLDER_NOT_FOUND when server responds 404', async () => {
    clientMock.POST.mockResolvedValue({ response: { status: 404 } });

    const { error, data } = await createFile(props);

    expect(data).toBeUndefined();
    expect(error?.code).toStrictEqual('FOLDER_NOT_FOUND');
  });
});
