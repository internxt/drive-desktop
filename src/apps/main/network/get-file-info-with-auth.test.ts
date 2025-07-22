import { describe, it, expect, vi, afterEach } from 'vitest';
import { getFileInfoWithAuth } from './get-file-info-with-auth';
import * as getFileInfoModule from './get-file-info';
import * as getAuthModule from './get-auth-from-credentials';

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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call getFileInfo with correct headers and return file info', async () => {
    const getFileInfoSpy = vi.spyOn(getFileInfoModule, 'getFileInfo').mockResolvedValue(mockFileInfo);
    const getAuthSpy = vi.spyOn(getAuthModule, 'getAuthFromCredentials').mockReturnValue({ Authorization: 'Basic test' });

    const result = await getFileInfoWithAuth({ bucketId: 'b', fileId: 'id', creds });

    expect(getAuthSpy).toHaveBeenCalledWith({ creds });
    expect(getFileInfoSpy).toHaveBeenCalledWith({
      bucketId: 'b',
      fileId: 'id',
      opts: { headers: { Authorization: 'Basic test' } },
    });
    expect(result).toEqual(mockFileInfo);
  });
});
