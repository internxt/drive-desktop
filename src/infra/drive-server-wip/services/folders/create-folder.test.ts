import { createFolder } from './create-folder';
import { client } from '@/apps/shared/HttpClient/client';

describe('create-folder', () => {
  const clientMock = vi.mocked(client);

  it('Should return ALREADY_EXISTS error when folder already exists', async () => {
    clientMock.POST.mockResolvedValue({ response: { status: 409 } });
    const { error } = await createFolder({ body: { parentFolderUuid: 'uuid', plainName: 'test' } });
    expect(error?.code).toStrictEqual('ALREADY_EXISTS');
  });
});
