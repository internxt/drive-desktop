import { clientMock } from 'tests/vitest/mocks.helper.test';
import { createFolder } from './create-folder';

describe('create-folder', () => {
  it('Should return ALREADY_EXISTS error when folder already exists', async () => {
    clientMock.POST.mockResolvedValue({ response: { status: 409 } });
    const { error } = await createFolder({ body: { parentFolderUuid: 'uuid', plainName: 'test' } });
    expect(error?.code).toStrictEqual('ALREADY_EXISTS');
  });
});
