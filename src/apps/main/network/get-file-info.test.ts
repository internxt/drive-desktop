import { mockProps } from '@/tests/vitest/utils.helper.test';
import { getFileInfo } from './get-file-info';
import { describe, expect, it, vi } from 'vitest';

describe('get-file-info', () => {
  const props = mockProps<typeof getFileInfo>({
    bucketId: 'b',
    fileId: 'id',
    opts: { headers: {} },
  });

  it('should fetch and return file info', async () => {
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
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => mockFileInfo });
    const result = await getFileInfo(props);
    expect(global.fetch).toHaveBeenCalled();
    expect(result).toEqual(mockFileInfo);
  });

  it('should throw if fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'fail', json: () => ({}) });
    await expect(getFileInfo(props)).rejects.toThrow('Failed to fetch file info: 500 fail');
  });
});
