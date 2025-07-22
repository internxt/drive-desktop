import { describe, it, expect, vi, afterEach } from 'vitest';
import { getFileInfoWithAuth } from './get-file-info-with-auth';
import * as getFileInfoModule from './get-file-info';
import * as getAuthModule from './get-auth-from-credentials';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';

const mockFileInfo = {
  bucket: 'b',
  mimetype: 'm',
  filename: 'f',
  frame: 'fr',
  size: 1,
  id: 'id',
  created: new Date(),
  hmac: { value: '', type: '' },
  index: '0',
};

const creds = { user: 'test', pass: 'secret' };

describe('get-file-info-with-auth', () => {
  const getFileInfoMock = partialSpyOn(getFileInfoModule, 'getFileInfo');
  const getAuthMock = partialSpyOn(getAuthModule, 'getAuthFromCredentials');
  const props = mockProps<typeof getFileInfoWithAuth>({ bucketId: 'b', fileId: 'id', creds });

  it('should call getFileInfo with correct headers and return file info', async () => {
    getFileInfoMock.mockResolvedValue(mockFileInfo);
    getAuthMock.mockReturnValue({ Authorization: 'Basic test' });

    const result = await getFileInfoWithAuth(props);

    expect(getAuthMock).toBeCalledWith({ creds });
    expect(getFileInfoMock).toBeCalledWith({
      bucketId: 'b',
      fileId: 'id',
      opts: { headers: { Authorization: 'Basic test' } },
    });
    expect(result).toEqual(mockFileInfo);
  });
});
