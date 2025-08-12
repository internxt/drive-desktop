import { mockProps } from '@/tests/vitest/utils.helper.test';
import { getFileInfo } from './get-file-info';

describe('get-file-info', () => {
  const props = mockProps<typeof getFileInfo>({
    bucketId: 'b',
    fileId: 'id',
    opts: { headers: { 'Content-Type': 'application/json' } },
  });

  it('should fetch and return file info', async () => {
    const mockFileInfo = {
      bucket: 'b',
    };

    const expectedUrl = `${process.env.BRIDGE_URL}/buckets/${props.bucketId}/files/${props.fileId}/info`;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => mockFileInfo });
    const result = await getFileInfo(props);
    expect(global.fetch).toHaveBeenCalledWith(expectedUrl, {
      method: 'GET',
      headers: {
        ...props.opts.headers,
      },
    });
    expect(result).toStrictEqual(mockFileInfo);
  });

  it('should throw if fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'fail' });
    await expect(getFileInfo(props)).rejects.toThrow('Failed to fetch file info: 500 fail');
  });
});
