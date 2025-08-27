import { clientMock } from 'tests/vitest/mocks.helper.test';
import { createFile } from './create-file';
import { mockProps } from '@/tests/vitest/utils.helper.test';

describe('create-file', () => {
  const props = mockProps({});

  it('should return FOLDER_NOT_FOUND when server responds 404', async () => {
    clientMock.POST.mockResolvedValue({ response: { status: 404 } });

    const { error, data } = await createFile(props);

    expect(data).toBeUndefined();
    expect(error?.code).toStrictEqual('FOLDER_NOT_FOUND');
  });
});
